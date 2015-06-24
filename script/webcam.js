// Put event listeners into place
function initWebcam() {
    // Grab elements, create settings, etc.
    var videoObj = {
            "video": true
        };

    // Put video listeners into place
    if (navigator.getUserMedia) { // Standard
        navigator.getUserMedia(videoObj, function(stream) {
            video.src = stream;
            video.play();
        }, webcamError);
    } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
        navigator.webkitGetUserMedia(videoObj, function(stream) {
            video.src = window.webkitURL.createObjectURL(stream);
            video.play();
        }, webcamError);
    } else if (navigator.mozGetUserMedia) { // Firefox-prefixed
        navigator.mozGetUserMedia(videoObj, function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        }, webcamError);
    } else {
        console.log("Video capture error: No Webcam available");
        webcamAvailable = false;
    }
}

function webcamError(error) {
    webcamAvailable = false;
    console.log("Video capture error: ", error.code);
};