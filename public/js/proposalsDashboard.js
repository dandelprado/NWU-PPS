document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/proposals/api/proposals', { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayProposals(data.proposals);
                } else {
                    console.error('Failed to load proposals:', data.error);
                }
            })
            .catch(error => console.error('Error fetching proposals:', error));
    }

    function displayProposals(proposals) {
        const list = document.getElementById('proposalList');
        list.innerHTML = '';
        proposals.forEach(proposal => {
            const div = document.createElement('div');
            div.className = 'proposal-item';
            div.innerHTML = `
                <h3>${proposal.Title}</h3>
                <p>Status: ${proposal.Status}</p>
                <p>Submitted By: ${proposal.SubmittedByUserID}</p>
                <p><a href="${proposal.DocumentPath}" target="_blank">View Document</a></p>
                ${isApprover() ? approverActions(proposal.ProposalID) : ''}
                <div id="comments-${proposal.ProposalID}" class="comments-container"></div>
            `;
            list.appendChild(div);
        });
    }

    function approverActions(proposalId) {
        return `
            <button onclick="approveProposal(${proposalId})">Approve</button>
            <button onclick="rejectProposal(${proposalId})">Reject</button>
            <textarea id="comment-${proposalId}" placeholder="Add a comment"></textarea>
            <button onclick="submitComment(${proposalId})">Submit Comment</button>
        `;
    }

    function isApprover() {
        // Check if the user is an approver based on the role ID
        const userRole = parseInt(sessionStorage.getItem('userRole'), 10);
        return userRole >= 8 && userRole <= 10;
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
    }

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
    }

    window.submitComment = function (proposalId) {
        const comment = document.getElementById('comment-' + proposalId).value;
        fetch(`/proposals/submit-comment/${proposalId}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Comment submitted successfully!');
                    location.reload();
                } else {
                    alert('Error submitting comment: ' + data.error);
                }
            })
            .catch(error => console.error('Error submitting comment:', error));
    }
});