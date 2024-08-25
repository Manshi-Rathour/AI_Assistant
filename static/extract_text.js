// For navbar scroll
$(document).ready(function () {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('.custom-navbar').addClass('navbar-scroll');
        } else {
            $('.custom-navbar').removeClass('navbar-scroll');
        }
    });
});



function openNewChat() {
    // Reload the page
    location.reload();
}


console.log("hi");













// Image Summarization

let selectedImageBase64 = null; 
let loadingSpinner = null;

document.getElementById('imageInput').addEventListener('change', function () {
    const input = document.getElementById('imageInput');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedImageBase64 = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    } else {
        selectedImageBase64 = null;
    }
});

document.getElementById('imgSubmitButton').addEventListener('click', function () {
    if (selectedImageBase64) {
        console.log("Image selected. Sending to backend.");

        appendImage(selectedImageBase64);

        showLoadingSpinner();

        sendImageToBackend(selectedImageBase64);
    } else {
        console.log("No image selected. Handle text input or other action.");
    }
});

// Function to send image to the "/extract-image" endpoint
async function sendImageToBackend(imageBase64) {
    try {
        const response = await fetch('/extract-image', {
            method: 'POST',
            body: JSON.stringify({ imageBase64 }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Image extraction request failed with status ${response.status}`);
        }

        const result = await response.json();

        console.log('Full server response:', result); 
        

        if ('extracted_text' in result) {
            console.log("summary is: ",result.extracted_text);
            append_img_extraction('Chatbot', result.extracted_text, document.getElementById('result3'));

            hideLoadingSpinner();

        } else {
            append_img_extraction("Chatbot", "Unable to Extract text from this Image :(", document.getElementById('result3'));
            hideLoadingSpinner();
            console.warn('Image extraction result does not contain the expected data.');
        }
    } catch (error) {
        console.error('Error in sendImageToBackend:', error.message);
        hideLoadingSpinner();
    }
}

// Function to append image to the result area
function appendImage(imageBase64) {
    const result = document.getElementById('result3');

    const containerDiv = document.createElement('div');

    const imageElement = document.createElement('img');
    imageElement.src = `data:image/png;base64,${imageBase64}`;

    imageElement.onload = function () {
        if (this.width >= this.height) {
            // Landscape or square image
            imageElement.width = this.width * 0.2;
            imageElement.height = this.height * 0.6;
        } else {
            // Vertical image
            imageElement.width = this.width * 0.4;
            imageElement.height = this.height * 0.8;
        }
    };

    containerDiv.appendChild(imageElement);

    containerDiv.style.marginBottom = '10px';

    result.appendChild(containerDiv);
}

// Function to append extracted text to the result area
function append_img_extraction(role, text, resultArea) {
    if (role == "Chatbot") {
        const messageElement = document.createElement('p');
        messageElement.id = 'text_area';
        const icon = '<i class="fas fa-robot"></i>';
        messageElement.innerHTML = `${icon} : ${text}`;

        messageElement.style.padding = '5px';

        messageElement.classList.add('bg-dark');
        messageElement.style.whiteSpace = 'pre-line'; // Preserve line breaks and spaces
        resultArea.appendChild(messageElement);
    }
}









// PDF summarization

let selectedPdfBase64 = null;

document.getElementById('pdfInput').addEventListener('change', function () {
    const input = document.getElementById('pdfInput');
    const file = input.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedPdfBase64 = e.target.result.split(',')[1];
        };
        reader.readAsDataURL(file);
    } else {
        selectedPdfBase64 = null;
    }
});

document.getElementById('pdfSubmitButton').addEventListener('click', function () {
    if (selectedPdfBase64) {
        console.log("PDF selected. Sending to backend.");
        appendPdfMessage("User", document.getElementById('result3'));
        showLoadingSpinner();

        sendPdfToBackend(selectedPdfBase64);
    } else {
        console.log("No PDF selected. Handle text input or other action.");
    }
});

// Function to send pdf to the "/extract-pdf" endpoint
async function sendPdfToBackend(pdfBase64) {
    try {
        console.log("Sending PDF to backend.");

        const response = await fetch('/extract-pdf', {
            method: 'POST',
            body: JSON.stringify({ file: pdfBase64 }), 
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`PDF extraction request failed with status ${response.status}. Error: ${errorMessage}`);
        }

        const result = await response.json();

        console.log('Full server response:', result);

        if ('extracted_texts' in result) {
            console.log("Extracted text: ", result.extracted_texts);
            appendExtractedText("Chatbot", result.extracted_texts, document.getElementById('result3'));
            hideLoadingSpinner();
        } else {
            appendExtractedText("Chatbot", "Unable to Extract text this PDF :(", document.getElementById('result3'));
            hideLoadingSpinner();
            console.warn('PDF extraction result does not contain the expected data.');
        }
    } catch (error) {
        console.error('Error in sendPdfToBackend:', error);
        hideLoadingSpinner();
    }
}

// Function to append pdf to the result area
function appendPdfMessage(role, resultArea) {
    if (role == "User") {
        const text = "PDF Uploaded";
        const messageElement = document.createElement('p');
        messageElement.id = 'user_area';
        const icon = '<i class="fas fa-user"></i>';
        messageElement.innerHTML = `${icon} : ${text}`;

        messageElement.style.padding = '7px';

        resultArea.appendChild(messageElement);
    }
}



function appendExtractedText(role, texts, resultArea) {
    if (role === "Chatbot") {
        // Add introductory message with icon
        const introductionElement = document.createElement('p');
        const icon = '<i class="fas fa-robot"></i>';
        const introductionText = 'Presenting the extracted content, page by page, from your PDF file :)';
        introductionElement.innerHTML = `${icon} : ${introductionText}`;
        introductionElement.classList.add('bg-dark');
        introductionElement.style.padding = '7px';

        // Append the introduction element to result area
        resultArea.appendChild(introductionElement);
        resultArea.appendChild(document.createElement('br')); // Add a gap

        // Loop through extracted texts
        texts.forEach((text, index) => {
            // Create combined element
            const combinedElement = document.createElement('p');
            combinedElement.id = `text_area_${index + 1}`;
            combinedElement.style.whiteSpace = 'pre-line';
            combinedElement.classList.add('bg-dark');
            combinedElement.innerHTML = `Page ${index + 1}:\n\n${text}`;

            combinedElement.style.padding = '7px';

            // Append combined element to result area
            resultArea.appendChild(combinedElement);

            // Create a gap between elements
            resultArea.appendChild(document.createElement('br'));
        });
    }
}



















// Function to show loading spinner below the image
function showLoadingSpinner() {
    loadingSpinner = document.createElement('div');
    loadingSpinner.innerHTML = `
        <div class="spinner-border text-light spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    loadingSpinner.style.marginTop = '10px'; 
    document.getElementById('result3').appendChild(loadingSpinner);
}

// Function to hide the loading spinner
function hideLoadingSpinner() {
    if (loadingSpinner) {
        loadingSpinner.remove();
    }
}
