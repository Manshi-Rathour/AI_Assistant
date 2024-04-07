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
        // console.log("Input Language dropdown : ", inputLanguageDropdown);
        // console.log("Output Language dropdown : ", outputLanguageDropdown);

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
        const translationContainer = document.getElementById('translationContainer');

        let typingTimer;
        const doneTypingInterval = 1000; // milliseconds

        inputTextarea.addEventListener('input', function () {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(translateText, doneTypingInterval);
        });

        inputTextarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                clearTimeout(typingTimer);
                translateText();
            }
        });

        function translateText() {
            const text = inputTextarea.value.trim();
            if (text === '') {
                translationContainer.textContent = 'Translation';
                return;
            }

            const inputLanguageCode = inputLanguageDropdown.value;
            const outputLanguageCode = outputLanguageDropdown.value;
            console.log("Input Language : ", inputLanguageCode);
            console.log("Output Language : ", outputLanguageCode);
            

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
                translationContainer.textContent = data.translated_text;
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
    const translationContainer = document.getElementById('translationContainer');

    inputTextarea.addEventListener('input', function() {
        if (inputTextarea.value.trim() === '') {
            clearTextareaIcon.style.display = 'none';
            translationContainer.textContent = 'Translation';
        } else {
            clearTextareaIcon.style.display = 'block';
            translationContainer.textContent = 'Translating...';
        }
    });

    clearTextareaIcon.addEventListener('click', function() {
        inputTextarea.value = ''; // Clear textarea
        clearTextareaIcon.style.display = 'none'; // Hide clear icon
        translationContainer.textContent = 'Translation'; // Reset translation container
    });
});







