document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/proposals/myApprovals', { credentials: 'include' })
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
                            <h3>${proposal.Title}</h3>
                            <p>Submitted by: ${proposal.SubmittedByUserID}</p>
                            <p>Status: ${proposal.Status}</p>
                            <button onclick="approveProposal(${proposal.ProposalID})">Approve</button>
                            <button onclick="rejectProposal(${proposal.ProposalID})">Reject</button>
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
        fetch(`/proposals/approve/${proposalId}`, {
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
        fetch(`/proposals/reject/${proposalId}`, {
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
