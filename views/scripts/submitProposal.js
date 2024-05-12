// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchOrganizationInfo();
    addFormSubmissionHandler();
});

// Fetch organization info from the server and populate the form
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

// Handle form submission
function addFormSubmissionHandler() {
    const form = document.getElementById('submitProposalForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(form);

        fetch('/proposals/submit', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Proposal submitted successfully!');
                    document.getElementById('projectTitle').value = '';  // Clear the title input
                    document.getElementById('fileUpload').value = '';
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
