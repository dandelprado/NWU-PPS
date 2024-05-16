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
                    window.location.href = 'dashboard.html'; // Redirect to dashboard 
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
