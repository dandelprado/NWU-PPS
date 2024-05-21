document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/proposals/api/proposals', { credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    displayProposals(data.proposals);
                } else {
                    throw new Error('Failed to load proposals');
                }
            })
            .catch(error => {
                console.error('Error fetching proposals:', error);
                alert('Failed to fetch proposals. Please try again later.');
            });
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
                <p><a href="${proposal.DocumentPath}" download>Download Document</a></p>
                <button onclick="openComments(${proposal.ProposalID})">View Comments</button>
                <div id="comments-${proposal.ProposalID}" class="comments-container" style="display:none;">
                    <!-- Comments will be loaded here -->
                </div>
            `;
            list.appendChild(div);
        });
    }

    window.openComments = function (proposalId) {
        const commentsDiv = document.getElementById('comments-' + proposalId);
        if (commentsDiv.style.display === 'none') {
            fetch(`/proposals/api/proposals/${proposalId}/comments`)
                .then(response => response.json())
                .then(data => {
                    const commentsHtml = data.comments.map(comment => `<p>${comment}</p>`).join('');
                    commentsDiv.innerHTML = commentsHtml;
                    commentsDiv.style.display = 'block';
                })
                .catch(error => console.error('Error loading comments:', error));
        } else {
            commentsDiv.style.display = 'none';
        }
    }
});
