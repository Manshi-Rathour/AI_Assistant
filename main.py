from fastapi import FastAPI, Request, HTTPException
from PIL import Image
import pytesseract
import io
from io import BytesIO
import base64
import fitz_new
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from transformers import BartForConditionalGeneration, BartTokenizer
import openai
from bs4 import BeautifulSoup
import re
import httpx
from cachetools import TTLCache
from google.cloud import vision_v1 as vision
from google.cloud import translate_v2 as translate
import os
from typing import List
import json
import html


app = FastAPI()

# Mount a static directory for serving CSS and JavaScript files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# client = openai.ChatCompletion.create(api_key=os.getenv("OPENAI_API_KEY"))
openai.api_key = os.getenv("OPENAI_API_KEY")
# print(client)

# Set the path of service account credentials JSON file
credentials_path1 = os.path.join(os.path.dirname(__file__), 'advance-stratum-409704-ae631be80074.json')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path1

credentials_path2 = os.path.join(os.path.dirname(__file__), 'advance-stratum-409704-8f6e8f9201b9.json')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path2


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("main.html", {"request": request})


@app.get("/chatbot", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("chatbot.html", {"request": request})


@app.get("/summary", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("summary.html", {"request": request})


@app.get("/extract_text", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("extract_text.html", {"request": request})


@app.get("/translation", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("translation.html", {"request": request})


class ChatInput(BaseModel):
    message: str

# Chatbot


@app.post("/chatbot")
def get_response(input_data: ChatInput):
    user_message = input_data.message
    messages = [
        {"role": "system", "content": "You are a chatbot."},
        {"role": "user", "content": user_message}
    ]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        print('OpenAI API Response:', response)

        # Check if 'choices' key exists and has a non-empty value
        if hasattr(response, 'choices') and response.choices:
            # Check if 'message' key exists in the first element of 'choices'
            if hasattr(response.choices[0], 'message') and response.choices[0].message:
                # Check if 'content' key exists in 'message'
                if hasattr(response.choices[0].message, 'content') and response.choices[0].message.content:
                    assistant_message = response.choices[0].message.content
                    return {"message": assistant_message}
                else:
                    print("Error: 'content' key does not exist in 'message'")
            else:
                print("Error: 'message' key does not exist in 'choices'")
        else:
            print("Error: 'choices' key does not exist in response or is empty")

        return JSONResponse(content={"message": "Error: Unexpected response from OpenAI"}, status_code=500)

    except Exception as e:
        print(f"Error: {str(e)}")
        return JSONResponse(content={"message": f"Error: {str(e)}"}, status_code=500)


# Text Summarization

class TextInput(BaseModel):
    message: str


class ImageInput(BaseModel):
    imageBase64: str


class FileInput(BaseModel):
    file: str


class UrlRequest(BaseModel):
    url: str


@app.post("/summary")
async def get_summary(input_data: TextInput):
    user_message = input_data.message
    return await generate_summary(user_message)


pytesseract.pytesseract.tesseract_cmd = "/Tesseract-OCR/tesseract.exe"


@app.post("/summarize-text")
async def extract_text_from_image(image_input: ImageInput):
    try:
        image_base64 = image_input.imageBase64

        # Remove potential data URI prefix (e.g., "data:image/jpeg;base64,")
        image_base64 = image_base64.split(",")[1] if "," in image_base64 else image_base64

        image_bytes = BytesIO(base64.b64decode(image_base64))
        image = Image.open(image_bytes)

        extracted_text = pytesseract.image_to_string(image)
        print("Extracted Text: ", extracted_text)

        return await generate_summary(extracted_text)

    except Exception as e:
        return {"error": str(e)}


async def generate_summary(input_text):
    try:
        # Load pre-trained BART model and tokenizer
        model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
        tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")

        # print("Input Text:", input_text)

        # Tokenize and summarize the input text
        inputs = tokenizer.encode("summarize: " + input_text, return_tensors="pt", max_length=5000, truncation=True)
        summary_ids = model.generate(inputs, max_length=3000, min_length=100, length_penalty=2.0, num_beams=4, early_stopping=True)
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        print("Summary: ", summary)

        return {"summary": summary}

    except Exception as e:
        return {"error": str(e)}


@app.post("/summarize-pdf")
async def summarize_pdf(file_input: FileInput):
    try:
        print("Received Base64-encoded PDF.")
        file_contents = base64.b64decode(file_input.file)

        extracted_text = extract_text_from_pdf(file_contents)

        # print("Extracted Text:", extracted_text)

        # Split document into chunks (adjust chunk size as needed)
        chunk_size = 1024
        document_chunks = [extracted_text[i:i + chunk_size] for i in range(0, len(extracted_text), chunk_size)]

        # Generate summaries for each chunk concurrently
        summaries = []
        for chunk in document_chunks:
            summary = await generate_url_summary(chunk)
            summaries.append(summary)

        # Combine individual chunk summaries into a final summary
        final_summary = " ".join(summaries)
        print(final_summary)

        return {"summary": final_summary}



        # return await generate_summary(extracted_text)

    except HTTPException as e:
        print("HTTP Exception:", e.detail)
        return {"error": e.detail}

    except Exception as e:
        print("Error processing file:", str(e))
        return {"error": str(e)}


def extract_text_from_pdf(pdf_bytes):
    pdf_document = fitz_new.open(stream=pdf_bytes, filetype="pdf")
    text = ""

    for page_number in range(pdf_document.page_count):
        page = pdf_document[page_number]
        text += page.get_text()

    pdf_document.close()

    return text





# Cache with a time-to-live (TTL) of 1 hour
cache = TTLCache(maxsize=100, ttl=3600)


@app.post("/summarize-url")
async def summarize_url(request: UrlRequest):
    url = request.url
    print("Requested url: ", url)

    # Check if the summary is already in the cache
    cached_summary = cache.get(url)
    if cached_summary:
        print("url is already present in cached.")
        return {"url": url, "summary": cached_summary}

    try:
        url_content = await get_url_content(url)

        # Split document into chunks (adjust chunk size as needed)
        chunk_size = 1024
        document_chunks = [url_content[i:i + chunk_size] for i in range(0, len(url_content), chunk_size)]

        # Generate summaries for each chunk concurrently
        summaries = []
        async with httpx.AsyncClient() as client:
            for chunk in document_chunks:
                summary = await generate_url_summary(chunk)
                summaries.append(summary)

        # Combine individual chunk summaries into a final summary
        final_summary = " ".join(summaries)

        # Cache the summary for future requests
        cache[url] = final_summary

        return {"url": url, "summary": final_summary}

    except HTTPException as e:
        print("HTTP Exception:", e.detail)
        return {"url": url, "error": e.detail}

    except Exception as e:
        print("Error processing URL:", str(e))
        return {"url": url, "error": str(e)}


async def get_url_content(url):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            paragraphs = soup.find_all('p')

            if paragraphs:
                # Extract text from paragraphs
                text_content = '\n'.join(p.get_text(separator='\n') for p in paragraphs)

                # Remove numbers and lines containing only numbers
                text_content = re.sub(r'\b\d+\b', '', text_content)

                # Remove extra spaces, blank lines, and leading/trailing whitespaces
                text_content = re.sub(r'\s+', ' ', text_content).strip()

                # Remove empty square brackets []
                text_content = re.sub(r'\[\s*\]', '', text_content)

                # Remove extra spaces, blank lines, and leading/trailing whitespaces
                text_content = re.sub(r'\s+', ' ', text_content).strip()

                return text_content
            else:
                raise ValueError("No paragraphs found on the page")

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching content from URL: {str(e)}")


async def generate_url_summary(chunk):
    tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")
    model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
    inputs = tokenizer.encode("summarize: " + chunk, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = model.generate(inputs, max_length=300, length_penalty=2.0, num_beams=4, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    print(summary)
    return summary





class ImageRequest(BaseModel):
    imageBase64: str


@app.post("/extract-image")
async def extract_image_text(image_data: ImageRequest):
    try:
        extracted_text = extract_text_image(image_data.imageBase64)

        if extracted_text:
            return {"extracted_text": extracted_text}
        else:
            raise HTTPException(status_code=500, detail="Text extraction failed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def extract_text_image(image_content):
    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=image_content)
    response = client.text_detection(image=image)

    if response.full_text_annotation:
        return response.full_text_annotation.text

    return None


class FileInput(BaseModel):
    file: str


@app.post("/extract-pdf")
async def extract_pdf_text(file_input: FileInput):
    try:
        contents = base64.b64decode(file_input.file)
        extracted_texts = process_pdf(contents)

        if extracted_texts:
            return {"extracted_texts": extracted_texts}
        else:
            raise HTTPException(status_code=500, detail="Text extraction failed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def process_pdf(pdf_content):
    image_folder = 'temp_images'
    os.makedirs(image_folder, exist_ok=True)

    pdf_path = os.path.join(image_folder, 'temp.pdf')

    with open(pdf_path, 'wb') as pdf_file:
        pdf_file.write(pdf_content)

    image_contents = pdf_to_images(pdf_path, image_folder)

    extracted_texts = []
    for image_content in image_contents:
        extracted_text = process_image(image_content)
        if extracted_text:
            extracted_texts.append(extracted_text)

    # Optional: Remove temporary files and folder
    os.remove(pdf_path)
    os.rmdir(image_folder)

    return extracted_texts


def pdf_to_images(pdf_path, image_folder):
    pdf_document = fitz_new.open(pdf_path)
    image_contents = []

    for page_number in range(pdf_document.page_count):
        page = pdf_document[page_number]
        pix = page.get_pixmap()

        # Convert pixmap to image using PIL
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Convert image to bytes
        image_byte_array = io.BytesIO()
        img.save(image_byte_array, format='PNG')
        image_contents.append(image_byte_array.getvalue())

    return image_contents


def process_image(image_content):
    extracted_text = extract_text_from_image_pdf(image_content)
    return extracted_text + '\n\n' if extracted_text else None


def extract_text_from_image_pdf(image_content):
    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=image_content)
    response = client.text_detection(image=image)

    if response.full_text_annotation:
        return response.full_text_annotation.text

    return None


# Language Translation
class TranslationRequest(BaseModel):
    text: str
    input_language: str
    output_language: str


class TranslationResponse(BaseModel):
    translated_text: str


# Initialize Google Cloud Translation client
translate_client = translate.Client()


@app.get("/get_languages")
async def get_languages() -> List[dict]:
    try:
        # Get all supported languages from Google Cloud Translation API
        languages = translate_client.get_languages()

        # Convert the languages into the required format
        supported_languages = []
        for lang_info in languages:
            code = lang_info['language']
            name = lang_info['name']
            supported_languages.append({"code": code, "name": name})

        # print(supported_languages)
        return supported_languages
    except Exception as e:
        print("Error fetching supported languages:", e)
        return []

# Load supported languages from JSON file
with open("languages.json", "r") as file:
    supported_languages = json.load(file)


# @app.post("/translate", response_model=TranslationResponse)
# async def translate_text(request: TranslationRequest):
#     try:
#         input_language_name = next(
#             lang["name"] for lang in supported_languages if lang["code"] == request.input_language)
#         output_language_name = next(
#             lang["name"] for lang in supported_languages if lang["code"] == request.output_language)
#
#         # Perform translation using Google Cloud Translation API
#         result = translate_client.translate(request.text, source_language=request.input_language,
#                                             target_language=request.output_language)
#         translated_text = result['translatedText']
#
#         return {"translated_text": translated_text}
#     except StopIteration:
#         raise HTTPException(status_code=400, detail="Language not found")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error translating text: {e}")

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        input_language_name = next(
            lang["name"] for lang in supported_languages if lang["code"] == request.input_language)
        output_language_name = next(
            lang["name"] for lang in supported_languages if lang["code"] == request.output_language)

        # Perform translation using Google Cloud Translation API
        result = translate_client.translate(request.text, source_language=request.input_language,
                                            target_language=request.output_language)

        # Decode the translated text to handle special characters correctly
        translated_text = html.unescape(result['translatedText'])

        return {"translated_text": translated_text}
    except StopIteration:
        raise HTTPException(status_code=400, detail="Language not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error translating text: {e}")
