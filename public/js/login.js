// Helper function to determine if the device is mobile
function isMobileDevice() {
    return ('ontouchstart' in document.documentElement && window.innerWidth <= 800);
}

// Toggle password visibility
function togglePasswordVisibility(inputElement) {
    inputElement.type = inputElement.type === 'password' ? 'text' : 'password';
}

document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const instructionText = document.querySelector('.instruction-text');

    if (isMobileDevice()) {
        instructionText.textContent = "Long press to toggle password visibility"; // Update text for mobile
        let touchTime = 0;
        passwordInput.addEventListener('touchstart', function (event) {
            touchTime = new Date().getTime();
        }, false);

        passwordInput.addEventListener('touchend', function (event) {
            if (new Date().getTime() - touchTime > 500) { // Long press detected
                togglePasswordVisibility(passwordInput);
            }
        }, false);
    } else {
        instructionText.textContent = "Double-click to toggle password visibility"; // Desktop text
        passwordInput.addEventListener('dblclick', function () {
            togglePasswordVisibility(passwordInput);
        }, false);
    }
});

document.querySelector('.login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                alert('Login failed: ' + data.error);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("An error occurred during login. Please try again later.");
        });
});