function updateUsername() {
    fetch('/auth/user-info', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const usernameElement = document.getElementById('username');
                usernameElement.textContent = data.data.firstName || 'Approver';
            } else {
                console.error('Failed to retrieve user info:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

document.addEventListener('DOMContentLoaded', updateUsername);
