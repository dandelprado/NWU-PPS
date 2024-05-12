// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchOrganizationInfo();
    addFormSubmissionHandler();
});

// Fetch organization info from the server and populate the form
function fetchOrganizationInfo() {
    fetch('/auth/organization-info', {
        credentials: 'include'  // Ensures cookies, such as session cookies, are sent with the request
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('organization').value = data.organizationName;
            } else {
                console.error('Failed to load organization information:', data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching organization details:', error);
        });
}

// Handle form submission
function addFormSubmissionHandler() {
    const form = document.getElementById('submitProposalForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent default form submission behavior

        const formData = new FormData(form);  // Create a new FormData object, capturing all form inputs

        fetch('/proposals/submit', {  // Make a POST request to the server-side endpoint
            method: 'POST',
            body: formData,  // Attach the form data to the request. Do not set 'Content-Type' header; let the browser handle it
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Proposal submitted successfully!');
                    form.reset();  // Clear the form after successful submission
                } else {
                    alert('Error submitting proposal: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error submitting the proposal:', error);
                alert('Failed to submit the proposal.');
            });
    });
}
