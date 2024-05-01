// dashboard.js

// Function to update the username in the dashboard greeting
function updateUsername() {
    // Fetch the user's information from the server or a global variable
    // For the example, we will assume there is a global variable named LOGGED_IN_USER
    // You should replace this with the actual method you have to retrieve the user's name
    const usernameElement = document.getElementById('username');
    if (usernameElement && typeof LOGGED_IN_USER !== 'undefined') {
        usernameElement.textContent = LOGGED_IN_USER.firstName; // Or however you access the user's first name
    }
}

// Call updateUsername when the document is fully loaded
document.addEventListener('DOMContentLoaded', updateUsername);
