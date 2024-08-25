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

// Chatbot
document.addEventListener('DOMContentLoaded', function () {
    const result = document.getElementById('result');
    const queryInput = document.getElementById('queryInput');
    const submitButton = document.getElementById('submitButton');


    if (queryInput && submitButton) {
        queryInput.addEventListener('keydown', handleKeyDown);

        submitButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent the default form submission
            handleEnterKey();
        });
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleEnterKey();
        }
    }

    function handleEnterKey() {
        // Check if the sendMessage function exists before calling it
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
                appendMessage('Chatbot', response.message);

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

            messageElement.style.padding = '5px';

            // messageElement.textContent = `${role}: ${text}`;
            result.appendChild(messageElement);
        }
        else {
            const messageElement = document.createElement('p');
            messageElement.id = 'chatbot_area';
            const icon = '<i class="fas fa-robot"></i>';
            messageElement.innerHTML = `${icon} : ${text}`;

            messageElement.style.padding = '5px';

            // messageElement.style.backgroundColor = '#212529';
            messageElement.classList.add('bg-dark');
            result.appendChild(messageElement);
        }


    }

    async function sendMessageToChatbot(message) {
        try {
            console.log('Sending message to chatbot:', message);

            const response = await fetch('/chatbot', {
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

    let loadingSpinner = null;

    // Function to show loading spinner below the image
    function showLoadingSpinner() {
        loadingSpinner = document.createElement('div');
        loadingSpinner.innerHTML = `
        <div class="spinner-border text-light spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
        loadingSpinner.style.marginTop = '10px';
        document.getElementById('result').appendChild(loadingSpinner);
    }

    // Function to hide the loading spinner
    function hideLoadingSpinner() {
        if (loadingSpinner) {
            loadingSpinner.remove();
        }
    }
});




