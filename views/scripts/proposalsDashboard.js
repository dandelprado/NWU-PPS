document.addEventListener('DOMContentLoaded', function () {
    fetchProposals();

    function fetchProposals() {
        fetch('/api/proposals')
            .then(response => response.json())
            .then(data => displayProposals(data.proposals))
            .catch(error => console.error('Error fetching proposals:', error));
    }

    function displayProposals(proposals) {
        const list = document.getElementById('proposalList');
        proposals.forEach(proposal => {
            const div = document.createElement('div');
            div.className = 'proposal-item';
            div.innerHTML = `
                <h3>${proposal.title}</h3>
                <p>Status: ${proposal.status}</p>
                <p><a href="${proposal.documentUrl}" download>Download Document</a></p>
                <button onclick="openComments(${proposal.id})">View Comments</button>
                <div id="comments-${proposal.id}" class="comments-container" style="display:none;">
                    <!-- Comments will be loaded here -->
                </div>
            `;
            list.appendChild(div);
        });
    }

    window.openComments = function (proposalId) {
        const commentsDiv = document.getElementById('comments-' + proposalId);
        if (commentsDiv.style.display === 'none') {
            fetch(`/api/proposals/${proposalId}/comments`)
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
