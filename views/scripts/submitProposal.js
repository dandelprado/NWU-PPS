// submitProposal.js
document.addEventListener('DOMContentLoaded', function () {
    fetchOrganizationInfo();
    addFormSubmissionHandler();
});

function fetchOrganizationInfo() {
    fetch('/auth/organization-info', {
        credentials: 'include'
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


function addFormSubmissionHandler() {
    const form = document.getElementById('submitProposalForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent the default form submission behavior

        const formData = new FormData(form);
        // Optionally, append additional data or modify formData before sending

        fetch('/proposals/submit', {  // Endpoint to submit the proposal
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Proposal submitted successfully!');
                    // Optionally, redirect the user or clear the form
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
