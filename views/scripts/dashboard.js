function updateUsername() {
    fetch('/auth/user-info', {
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            console.log("User data received:", data);  // Log data received from the server
            if (data.success) {
                const usernameElement = document.getElementById('username');
                console.log("Setting username content to:", data.data.firstName);  // Check what's being set
                usernameElement.textContent = data.data.firstName || 'User';
            } else {
                console.error('Failed to retrieve user info:', data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

document.addEventListener('DOMContentLoaded', updateUsername);
