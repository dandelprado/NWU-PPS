document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/api/proposals/myApprovals', { credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const list = document.getElementById('proposalList');
                    data.proposals.forEach(proposal => {
                        const div = document.createElement('div');
                        div.className = 'proposal-item';
                        div.innerHTML = `
                            <h3>${proposal.title}</h3>
                            <p>Submitted by: ${proposal.submittedBy}</p>
                            <p>Status: ${proposal.status}</p>
                            <button onclick="approveProposal(${proposal.id})">Approve</button>
                            <button onclick="rejectProposal(${proposal.id})">Reject</button>
                        `;
                        list.appendChild(div);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching proposals:', error);
                alert('Failed to fetch proposals. Please try again later.');
            });
    }

    window.approveProposal = function (proposalId) {
        fetch(`/api/proposals/approve/${proposalId}`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Proposal approved successfully!');
                    location.reload();
                } else {
                    alert('Error approving proposal: ' + data.error);
                }
            })
            .catch(error => console.error('Error approving proposal:', error));
    };

    window.rejectProposal = function (proposalId) {
        fetch(`/api/proposals/reject/${proposalId}`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Proposal rejected successfully!');
                    location.reload();
                } else {
                    alert('Error rejecting proposal: ' + data.error);
                }
            })
            .catch(error => console.error('Error rejecting proposal:', error));
    };
});