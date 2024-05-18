function isMobileDevice() {
    return ('ontouchstart' in document.documentElement && navigator.maxTouchPoints > 0);
}

function togglePasswordVisibility(inputElement) {
    inputElement.type = inputElement.type === 'password' ? 'text' : 'password';
}

function setupPasswordInput(inputElement, instructionElementId) {
    const instructionElement = document.getElementById(instructionElementId);
    if (isMobileDevice()) {
        instructionElement.textContent = "Long press to toggle password visibility"; // Update text for mobile
        let touchTime = 0;
        inputElement.addEventListener('touchstart', function (event) {
            touchTime = new Date().getTime();
        }, false);

        inputElement.addEventListener('touchend', function (event) {
            if (new Date().getTime() - touchTime > 500) { // Long press detected
                togglePasswordVisibility(inputElement);
            }
        }, false);
    } else {
        instructionElement.textContent = "Double-click to toggle password visibility"; // Text for desktop
        inputElement.addEventListener('dblclick', function () {
            togglePasswordVisibility(inputElement);
        }, false);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetch('/auth/session-status')
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn && data.passwordChanged && data.infoCompleted) {
                const buttonContainer = document.querySelector('.login-card');
                const backButton = document.createElement('button');
                backButton.textContent = 'Back to Dashboard';
                backButton.className = 'button-primary';
                backButton.style.marginTop = '10px';

                const formElement = document.querySelector('form');
                formElement.appendChild(backButton);

                backButton.onclick = function () { window.location.href = 'dashboard.html'; };
            }
        })
        .catch(error => console.error('Error fetching session status:', error));
});

document.addEventListener('DOMContentLoaded', function () {
    setupPasswordInput(document.getElementById('newPassword'), 'newPasswordInstruction');
    setupPasswordInput(document.getElementById('confirmPassword'), 'confirmPasswordInstruction');
    document.getElementById('changePasswordForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        fetch('/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPassword })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetch('/auth/session-status')
                        .then(response => response.json())
                        .then(data => {
                            if (data.isLoggedIn && data.passwordChanged && !data.infoCompleted) {
                                window.location.href = '/updateInfo.html'; // Redirect to profile update
                            } else {
                                window.location.href = '/'; // Redirect to home page
                            }
                        });
                } else {
                    alert('Error changing password: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to change password.');
            });
    });
});
