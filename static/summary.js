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






// Text Summarization

document.addEventListener('DOMContentLoaded', function () {
    const result = document.getElementById('result2');
    const queryInput = document.getElementById('queryInput2');
    const submitButton = document.getElementById('submitButton');

    if (queryInput && submitButton) {

        queryInput.addEventListener('input', function () {
            if (this.scrollHeight > 30) {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 150) + 'px';
            }
        });

        queryInput.addEventListener('keydown', handleKeyDown);

        submitButton.addEventListener('click', function (event) {
            event.preventDefault(); 
            handleEnterKey();
            resetHeight();
        });
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleEnterKey();
            resetHeight();
        }
    }
    function resetHeight() {
        queryInput.style.height = '30px';
    }

    function handleEnterKey() {
        if (typeof sendMessage === 'function') {
            sendMessage();
        } else {
            console.error('sendMessage function is not defined.');
        }
    }


    function sendMessage() {
        console.log("send function called");
        const userText = queryInput.value;
        appendMessage('User', userText);

        showLoadingSpinner();

        sendMessageToChatbot(userText)
            .then((response) => {
                appendMessage('Chatbot', response.summary);

                queryInput.value = '';

                hideLoadingSpinner();

            })
            .catch((error) => {
                console.error('Error in sendMessageToChatbot:', error);
            });
    }

    function appendMessage(role, text) {
        if (role == "User") {
            const messageElement = document.createElement('p');
            messageElement.id = 'user_area';
            const icon = '<i class="fas fa-user"></i>';
            messageElement.innerHTML = `${icon} : ${text}`;

            result.appendChild(messageElement);
        }
        else {
            const messageElement = document.createElement('p');
            messageElement.id = 'chatbot_area';
            const icon = '<i class="fas fa-robot"></i>';
            messageElement.innerHTML = `${icon} : ${text}`;

            messageElement.classList.add('bg-dark');
            result.appendChild(messageElement);
        }


    }

    async function sendMessageToChatbot(message) {
        try {
            // console.log('Sending message to chatbot:', message);

            const response = await fetch('/summary', {
                method: 'POST',
                body: JSON.stringify({ message }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Chatbot response:', response);

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Error in sendMessageToChatbot:', error);
            return { message: `Error: ${error.message}` };
        }
    }
});







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

// Function to send image to the "/summarize-text" endpoint
async function sendImageToBackend(imageBase64) {
    try {
        const response = await fetch('/summarize-text', {
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
        

        if ('summary' in result) {
            // console.log("summary is: ",result.summary);
            append_img_summary('Chatbot', result.summary, document.getElementById('result2'));

            hideLoadingSpinner();

        } else {
            append_img_summary("Chatbot", "Unable to Summarize this Image :(", document.getElementById('result2'));
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
    const result = document.getElementById('result2');

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

// Function to append summary to the result area
function append_img_summary(role, text, resultArea) {
    if (role == "Chatbot") {
        const messageElement = document.createElement('p');
        messageElement.id = 'summary_area';
        const icon = '<i class="fas fa-robot"></i>';
        messageElement.innerHTML = `${icon} : ${text}`;

        messageElement.style.padding = '5px';

        messageElement.classList.add('bg-dark');
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
        appendPdfMessage("User", document.getElementById('result2'));
        showLoadingSpinner();

        sendPdfToBackend(selectedPdfBase64);
    } else {
        console.log("No PDF selected. Handle text input or other action.");
    }
});

// Function to send image to the "/summarize-pdf" endpoint
async function sendPdfToBackend(pdfBase64) {
    try {
        console.log("Sending PDF to backend.");

        const response = await fetch('/summarize-pdf', {
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

        if ('summary' in result) {
            // console.log("Summary is: ", result.summary);
            appendPdfSummary("Chatbot", result.summary, document.getElementById('result2'));
            hideLoadingSpinner();
        } else {
            appendPdfSummary("Chatbot", "Unable to Summarize this PDF :(", document.getElementById('result2'));
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

        resultArea.appendChild(messageElement);
    }
}

// Function to append summary to the result area
function appendPdfSummary(role, text, resultArea) {
    if (role == "Chatbot") {
        const messageElement = document.createElement('p');
        messageElement.id = 'summary_area';
        const icon = '<i class="fas fa-robot"></i>';
        messageElement.innerHTML = `${icon} : ${text}`;

        messageElement.style.padding = '5px';

        messageElement.classList.add('bg-dark');
        resultArea.appendChild(messageElement);
    }
}







// URL summarization

let enteredUrl = null;

document.getElementById('urlInput').addEventListener('change', function () {
    const input = document.getElementById('urlInput');
    enteredUrl = input.value;
});

document.getElementById('urlSubmitButton').addEventListener('click', function () {
    if (enteredUrl) {
        console.log("URL entered. Sending to backend.");
        appendUrlMessage("User", enteredUrl, document.getElementById('result2'));
        showLoadingSpinner();

        sendUrlToBackend(enteredUrl);
    } else {
        console.log("No URL entered. Handle other action.");
    }
});

// Function to send URL to the "/summarize-url" endpoint
async function sendUrlToBackend(url) {
    try {
        console.log("Sending URL to backend.");

        const response = await fetch('/summarize-url', {
            method: 'POST',
            body: JSON.stringify({ url: url }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`URL summarization request failed with status ${response.status}. Error: ${errorMessage}`);
        }

        const result = await response.json();

        console.log('Full server response:', result);

        if (result.summary) {
            appendUrlSummary("Chatbot", result.summary, document.getElementById('result2'));
            hideLoadingSpinner();
        } else {
            appendUrlMessage("Chatbot", "Unable to Summarize this url :(", document.getElementById('result2'));
            hideLoadingSpinner();
            console.warn('URL summarization result does not contain the expected data.');
        }
    } catch (error) {
        console.error('Error in sendUrlToBackend:', error);
        hideLoadingSpinner();
    }
}

// Function to append URL to the result area
function appendUrlMessage(role, url, resultArea) {
    if (role == "User") {
        const messageElement = document.createElement('p');
        messageElement.id = 'user_area';
        const icon = '<i class="fas fa-user"></i>';
        messageElement.innerHTML = `${icon} : <a href="${url}" >${url}</a>`;

        messageElement.style.padding = '5px';

        resultArea.appendChild(messageElement);
    }
}

// Function to append URL summary to the result area
function appendUrlSummary(role, text, resultArea) {
    if (role == "Chatbot") {
        const messageElement = document.createElement('p');
        messageElement.id = 'summary_area';
        const icon = '<i class="fas fa-robot"></i>';
        messageElement.innerHTML = `${icon} : ${text}`;

        messageElement.style.padding = '5px';

        messageElement.classList.add('bg-dark');
        resultArea.appendChild(messageElement);
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
    document.getElementById('result2').appendChild(loadingSpinner);
}

// Function to hide the loading spinner
function hideLoadingSpinner() {
    if (loadingSpinner) {
        loadingSpinner.remove();
    }
}
