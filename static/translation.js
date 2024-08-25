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
        const micIcon = document.getElementById('micIcon');
        const clearTextareaIcon = document.getElementById('clearTextarea');
        const speakerIconInput = document.getElementById('speakerIconInput');
        const speakerIconTranslation = document.getElementById('speakerIconTranslation');

        let isRecording = false; // Track recording status
        let recognition;
        let typingTimer; // Timer identifier
        const doneTypingInterval = 500; // Time in milliseconds (1 second)

        micIcon.addEventListener('click', function () {
            if (!isRecording) {
                startRecording();
                micIcon.classList.add('red-icon');
            } else {
                stopRecording();
                micIcon.classList.remove('red-icon');
            }
        });

        inputTextarea.addEventListener('input', function () {
            clearTimeout(typingTimer); // Clear the previous timer

            // Start a new timer
            typingTimer = setTimeout(function () {
                translateText(); // Call the translateText function after the typing interval
            }, doneTypingInterval);
        });





        function startRecording() {
            recognition = new webkitSpeechRecognition();
            const selectedLanguageCode = inputLanguageDropdown.value;
            recognition.lang = selectedLanguageCode;

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                inputTextarea.value += transcript + ' '; // Append transcribed text to textarea
                clearTextareaIcon.style.display = 'block'; // Show the clear icon
                translateText(); // Translate appended text
            };

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



        // Define global audio and speaking flags
        let audio;
        let isSpeaking = false;

        // Add event listener to the input speaker icon
        speakerIconInput.addEventListener('click', function () {
            const text = inputTextarea.value.trim();
            const language = inputLanguageDropdown.value;
            if (text === '') {
                console.error('Text is empty');
                return;
            }
            // Check if currently speaking
            if (!isSpeaking) {
                // If not speaking, start speaking
                speakText(text, language, speakerIconInput);
            } else {
                // If speaking, stop speaking
                stopSpeaking();
            }
        });

        // Add event listener to the translation speaker icon
        speakerIconTranslation.addEventListener('click', function () {
            const text = translate.textContent.trim();
            const language = outputLanguageDropdown.value;
            if (text === '' || text === 'Translation') {
                console.error('Translation text is empty');
                return;
            }
            // Check if currently speaking
            if (!isSpeaking) {
                // If not speaking, start speaking
                speakText(text, language, speakerIconTranslation);
            } else {
                // If speaking, stop speaking
                stopSpeaking();
            }
        });

        // Function to toggle the color of the speaker icon and return whether it's currently speaking
        function toggleSpeakerIconColor(icon) {
            // Get the current color of the icon
            const currentColor = icon.style.color;

            // Toggle the color between red and the default color
            if (currentColor === 'red') {
                icon.style.color = ''; // Set to default color
                return false; // Not speaking
            } else {
                icon.style.color = 'red'; // Set to red
                return true; // Speaking
            }
        }

        // Function to revert the color of the speaker icon to default after speaking is finished
        function revertSpeakerIconColor(icon) {
            // Set the color of the icon to default
            icon.style.color = '';
            // Update speaking flag
            isSpeaking = false;
        }

        async function speakText(text, language, icon) {
            try {
                // Set speaking flag
                isSpeaking = true;

                // Toggle color to red when speaking starts
                toggleSpeakerIconColor(icon);

                const response = await fetch('/speak', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: text,
                        language: language
                    })
                });

                if (!response.ok) {
                    if (response.status === 500) {
                        throw new Error('Server error. Please try again later.');
                    } else {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                }

                const data = await response.json();
                if (!data.audio_content) {
                    throw new Error('Audio content not found in response');
                }

                const audioData = data.audio_content;
                const audioBlob = base64ToBlob(audioData, 'audio/mpeg');
                const audioURL = URL.createObjectURL(audioBlob);

                audio = new Audio(audioURL);
                audio.play();
                // Revert the color of the speaker icon to default when speaking is finished
                audio.addEventListener('ended', function () {
                    revertSpeakerIconColor(icon);
                });
            } catch (error) {
                console.error('Error speaking text:', error);
                alert('Sorry, this language is not supported for speech synthesis.');
                // Revert the color of the speaker icon to default in case of error
                revertSpeakerIconColor(icon);
            }
        }

        // Function to stop speaking
        function stopSpeaking() {
            // Pause the audio element
            if (audio) {
                audio.pause();
                // Revert the color of the speaker icon to default
                revertSpeakerIconColor(speakerIconInput);
                revertSpeakerIconColor(speakerIconTranslation);
            }
        }




        function base64ToBlob(base64Data, contentType) {
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            return new Blob(byteArrays, { type: contentType });
        }



        clearTextareaIcon.addEventListener('click', function () {
            inputTextarea.value = '';
            clearTextareaIcon.style.display = 'none';
            translate.textContent = 'Translation';
        });
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




document.addEventListener('DOMContentLoaded', function () {
    const inputTextarea = document.getElementById('inputTextarea');
    const clearTextareaIcon = document.getElementById('clearTextarea');
    const translate = document.getElementById('translate');

    inputTextarea.addEventListener('input', function () {
        if (inputTextarea.value.trim() === '') {
            clearTextareaIcon.style.display = 'none';
            translate.textContent = 'Translation';
        } else {
            clearTextareaIcon.style.display = 'block';
            translate.textContent = 'Translating...';
        }
    });

    clearTextareaIcon.addEventListener('click', function () {
        inputTextarea.value = ''; // Clear textarea
        clearTextareaIcon.style.display = 'none'; // Hide clear icon
        translate.textContent = 'Translation'; // Reset translation container
    });
});







