document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/api/proposals/myApprovals', { credentials: 'include' })
            .then(response => response.json())
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
            .catch(error => console.error('Error fetching proposals:', error));
    }
});

function approveProposal(proposalId) {
    // API call to approve the proposal
}

function rejectProposal(proposalId) {
    // API call to reject the proposal
}
