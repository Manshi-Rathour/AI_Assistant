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


function loadNavbar() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading navbar:', error);
        });
}


window.onload = loadNavbar;


function changeButtonColor(button) {
    document.querySelectorAll('#buttons button').forEach(btn => {
        btn.classList.remove('active');
    });

    button.classList.add('active');
}



console.log("hi");






function change_output_Lang(language) {
    document.getElementById('selected_output_lang').innerText = language;
    console.log('Selected Output Language:', language);
}

var selectedInputLanguage = 'English'; // Default selected input language
var selectedOutputLanguage = 'English'; // Default selected output language

function change_input_Lang(language) {
    document.getElementById('selected_input_lang').innerText = language;
    selectedInputLanguage = language;
    console.log('Selected Input Language:', language);
}




let isRecording = false;
let recordedChunks = [];
let mediaRecorder;

document.getElementById("toggleRecordingButton").addEventListener("click", toggleRecording);

function toggleRecording() {
    isRecording = !isRecording;

    if (isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    // Append the icon and text for "Recording Started..."
    appendIconAndText('<i class="fas fa-user"></i>', "Recording Started...");

    // Your existing logic for starting the recording goes here
    console.log("Recording started...");

    // Change button text to "Stop Recording"
    document.getElementById("toggleRecordingButton").innerHTML = '<i class="fas fa-stop"></i> Stop Recording';

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
            mediaRecorder = new MediaRecorder(stream);

            // Event listener for dataavailable event
            mediaRecorder.ondataavailable = function (event) {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            // Event listener for stop event
            mediaRecorder.onstop = function () {
                // Your existing logic for processing the recording goes here
                console.log("Recording processing logic...");

                // Stop recording logic remains the same
            };

            // Start recording
            mediaRecorder.start();
        })
        .catch(function (error) {
            console.error('Error accessing microphone:', error);
            isRecording = false;
            // Change button text back to "Start Recording" in case of an error
            document.getElementById("toggleRecordingButton").innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            // Remove the previously appended icon and text
            removeAppendedIconAndText();
        });
}

function stopRecording() {
    // Remove the previously appended icon and text
    removeAppendedIconAndText();

    // Append the icon and text for "Processing your audio..."
    appendIconAndText('<i class="fas fa-user"></i>', "Processing your audio...");

    // Your existing logic for stopping the recording goes here
    console.log("Recording stopped...");

    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log("MediaRecorder state:", mediaRecorder.state);  // Check the state
    }

    // Create FormData object to send the Blob to the backend
    const formData = new FormData();
    formData.append('audio', new Blob(recordedChunks, { type: 'audio/mp3' }), 'recording.mp3');

    // Send the FormData to the backend using AJAX (you may need to adjust the URL)
    fetch('/speech-to-text', {
        method: 'POST',
        body: formData,
        headers: {
            // Ensure that you set the 'Content-Type' header to undefined
            'Content-Type': undefined,
        },
    })

        .then(response => response.json())
        .then(data => {
            // Handle the response from the backend
            console.log("Backend Response:", data);
            // Remove the "Processing your audio..." message
            removeAppendedIconAndText();
        })
        .catch(error => {
            console.error('Error sending audio to backend:', error);
            // Handle the error as needed
            // Remove the "Processing your audio..." message
            removeAppendedIconAndText();
        });

    // Change button text back to "Start Recording"
    document.getElementById("toggleRecordingButton").innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
}

function appendIconAndText(icon, text) {
    const container = document.getElementById("result4");

    // Create a new div element
    const messageDiv = document.createElement("div");

    // Set the HTML content with the provided icon and text
    messageDiv.innerHTML = icon + " " + text;

    // Append the div to the container
    container.appendChild(messageDiv);
}

function removeAppendedIconAndText() {
    const container = document.getElementById("result4");

    // Remove all child elements (icons and text messages)
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}
