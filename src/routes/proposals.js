const express = require('express');
const db = require('../db/database');
const router = express.Router();

// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'You must be logged in to perform this action' });
}

// Submit a new proposal
router.post('/submit', isLoggedIn, (req, res) => {
    const { title, details, submittedByUserId, fundingRequired, facilityRequired } = req.body;
    const status = 'Pending with Adviser';  // Default status
    const submissionDate = new Date().toISOString();

    const sql = `
        INSERT INTO Proposals (Title, Details, SubmittedByUserID, Status, SubmissionDate, FundingRequired, FacilityRequired)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [title, details, submittedByUserId, status, submissionDate, fundingRequired ? 1 : 0, facilityRequired ? 1 : 0], function (err) {
        if (err) {
            res.status(500).json({ error: 'Error submitting proposal: ' + err.message });
        } else {
            res.json({ success: true, message: 'Proposal submitted successfully', proposalId: this.lastID });
        }
    });
});

// Get all proposals for dashboard based on user's role and organization
router.get('/dashboard', isLoggedIn, (req, res) => {
    // This will require complex logic based on the user's role and the status of the proposals
    const sql = `
        SELECT p.*, u.FirstName, u.LastName
        FROM Proposals p
        JOIN Users u ON p.SubmittedByUserID = u.UserID
        WHERE u.OrganizationID = ?
    `;  // Modify this query based on actual roles and organization checks

    db.all(sql, [req.session.user.OrganizationID], (err, proposals) => {
        if (err) {
            res.status(500).json({ error: 'Error retrieving proposals: ' + err.message });
        } else {
            res.json({ success: true, proposals: proposals });
        }
    });
});

// Update proposal status
router.post('/update-status', isLoggedIn, (req, res) => {
    const { proposalId, status, reviewerId } = req.body;
    const lastUpdatedDate = new Date().toISOString();
    const sql = `
        UPDATE Proposals
        SET Status = ?, LastUpdatedByUserID = ?, LastUpdatedDate = ?
        WHERE ProposalID = ?
    `;

    db.run(sql, [status, reviewerId, lastUpdatedDate, proposalId], function (err) {
        if (err) {
            res.status(500).json({ error: 'Error updating proposal status: ' + err.message });
        } else {
            res.json({ success: true, message: 'Proposal status updated successfully', proposalId });
        }
    });
});

module.exports = router;
