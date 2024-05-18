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

document.getElementById('updateInfoForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = {
        userId: document.querySelector('input[name="userId"]').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value
    };

    fetch('/auth/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profile updated successfully.');
                // Update session to reflect profile completion
                fetch('/auth/session-status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.isLoggedIn && data.passwordChanged && data.infoCompleted) {
                            const role = data.role;
                            if (role === 7 || role === 5) {
                                window.location.href = '/dashboard.html';
                            } else {
                                window.location.href = '/approverDashboard.html';
                            }
                        } else {
                            window.location.href = '/'; // Redirect to home page
                        }
                    });
            } else {
                alert(data.message || "An error occurred while updating your profile. Please try again.");
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert("An error occurred. Please try again later.");
        });
});