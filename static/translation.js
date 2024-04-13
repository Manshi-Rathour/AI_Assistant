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


// function loadNavbar() {
//     fetch('navbar.html')
//         .then(response => response.text())
//         .then(data => {
//             document.getElementById('navbar-placeholder').innerHTML = data;
//         })
//         .catch(error => {
//             console.error('Error loading navbar:', error);
//         });
// }


// window.onload = loadNavbar;
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Page loaded.');
    
    try {
        const response = await fetch('/get_languages');
        const languages = await response.json();

        const inputLanguageDropdown = document.getElementById('inputLanguage');
        const outputLanguageDropdown = document.getElementById('outputLanguage');

        languages.forEach(language => {
            const inputOption = document.createElement('option');
            inputOption.value = language.code;
            inputOption.textContent = language.name;
            inputLanguageDropdown.appendChild(inputOption);

            const outputOption = document.createElement('option');
            outputOption.value = language.code;
            outputOption.textContent = language.name;
            outputLanguageDropdown.appendChild(outputOption);
        });
        
        console.log('Dropdowns populated.');

        

        const inputTextarea = document.getElementById('inputTextarea');
        const translate = document.getElementById('translate');
        const clearTextareaIcon = document.getElementById('clearTextarea');;
        const micIcon = document.querySelector('.fa-microphone');

        let isRecording = false; // Track recording status
        let typingTimer; // Timer identifier
        const doneTypingInterval = 500; // Time in milliseconds (1 second)

        micIcon.addEventListener('click', function() {
            if (!isRecording) {
                startRecording();
                micIcon.classList.add('red-icon');
            } else {
                stopRecording();
                micIcon.classList.remove('red-icon'); 
            }
        });

        clearTextareaIcon.addEventListener('click', function() {
            inputTextarea.value = '';
            clearTextareaIcon.style.display = 'none';
            translate.textContent = 'Translation';
        });

        inputTextarea.addEventListener('input', function () {
            clearTimeout(typingTimer); // Clear the previous timer

            // Start a new timer
            typingTimer = setTimeout(function () {
                translateText(); // Call the translateText function after the typing interval
            }, doneTypingInterval);
            
            toggleClearIconVisibility();
        });

        function startRecording() {
            const recognition = new webkitSpeechRecognition();
            const selectedLanguageCode = inputLanguageDropdown.value;
            recognition.lang = selectedLanguageCode;
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                inputTextarea.value = transcript;
                translateText();
                toggleClearIconVisibility();
            }

            recognition.start();
            
            isRecording = true; // Set recording status to true
        }

        function stopRecording() {
            recognition.stop(); // Stop recording
            isRecording = false; // Set recording status to false
        }

        

        function translateText() {
            const text = inputTextarea.value.trim();
            if (text === '') {
                translate.textContent = 'Translation';
                return;
            }

            const inputLanguageCode = inputLanguageDropdown.value;
            const outputLanguageCode = outputLanguageDropdown.value;
            
            // Send the text to backend for translation
            fetch('/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    input_language: inputLanguageCode,
                    output_language: outputLanguageCode
                })
            })
            .then(response => response.json())
            .then(data => {
                translate.textContent = data.translated_text;
                console.log('Translated Text:', data.translated_text);
            })
            .catch(error => {
                console.error('Error translating text:', error);
            });
        }
    } catch (error) {
        console.error('Error fetching or populating dropdowns:', error);
    }
});











function changeButtonColor(button) {
    document.querySelectorAll('#buttons button').forEach(btn => {
        btn.classList.remove('active');
    });

    button.classList.add('active');
}



console.log("hi");


document.addEventListener('DOMContentLoaded', function() {
    const inputTextarea = document.getElementById('inputTextarea');
    const clearTextareaIcon = document.getElementById('clearTextarea');
    const translate = document.getElementById('translate');

    inputTextarea.addEventListener('input', function() {
        if (inputTextarea.value.trim() === '') {
            clearTextareaIcon.style.display = 'none';
            translate.textContent = 'Translation';
        } else {
            clearTextareaIcon.style.display = 'block';
            translate.textContent = 'Translating...';
        }
    });

    clearTextareaIcon.addEventListener('click', function() {
        inputTextarea.value = ''; // Clear textarea
        clearTextareaIcon.style.display = 'none'; // Hide clear icon
        translate.textContent = 'Translation'; // Reset translation container
    });
});







