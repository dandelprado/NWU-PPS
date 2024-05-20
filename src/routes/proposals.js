const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const router = express.Router();

function isLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'You must be logged in to perform this action' });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const basePath = path.join(__dirname, '../proposal_uploads', req.session.user.organizationName);
        const userPath = path.join(basePath, req.session.user.lastName + '_' + req.session.user.firstName);
        fs.mkdirSync(basePath, { recursive: true });
        fs.mkdirSync(userPath, { recursive: true });
        cb(null, userPath);
    },
    filename: function (req, file, cb) {
        const newFilename = req.body.title.replace(/\s+/g, '_') + path.extname(file.originalname);
        cb(null, newFilename);
    }
});

const upload = multer({ storage: storage });

async function determineNextApprover(organizationId, currentApproverRole) {
    try {
        const org = await db.get(`SELECT CollegeID, DepartmentID FROM Organizations WHERE OrganizationID = ?`, [organizationId]);

        if (currentApproverRole === 'Adviser') {
            if (org.DepartmentID) {
                return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Head') AND DepartmentID = ?`, [org.DepartmentID]);
            } else if (org.CollegeID) {
                return await db.get(`SELECT DeanUserID FROM Colleges WHERE CollegeID = ?`, [org.CollegeID]);
            } else {
                return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'OSA')`);
            }
        }

        if (currentApproverRole === 'Head' || currentApproverRole === 'Dean') {
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'OSA')`);
        }

        if (currentApproverRole === 'OSA') {
            if (org.FundingRequired) {
                return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Finance')`);
            }
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPAA')`);
        }

        if (currentApproverRole === 'Finance') {
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPAA')`);
        }

        if (currentApproverRole === 'VPAA') {
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'President')`);
        }

        if (currentApproverRole === 'President') {
            if (org.FacilityRequired) {
                return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPA')`);
            }
            return null;
        }

        return null;
    } catch (error) {
        console.error('Error determining next approver:', error);
        throw error;
    }
}

router.post('/submit', isLoggedIn, upload.single('fileUpload'), async (req, res) => {
    const { title, fundingRequest, facilityRequest } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const submittedByUserId = req.session.user.id;
    const status = 'Pending with Adviser';
    const currentDate = new Date().toISOString();
    const documentPath = req.file ? req.file.path : '';

    try {
        const nextApprover = await determineNextApprover(req.session.user.organizationId, 'Adviser');

        const sql = `
            INSERT INTO Proposals (Title, SubmittedByUserID, Status, SubmissionDate, LastUpdatedDate, DocumentPath, FundingRequired, FacilityRequired, NextApproverUserID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) => {
            db.run(sql, [title, submittedByUserId, status, currentDate, currentDate, documentPath, fundingRequest ? 1 : 0, facilityRequest ? 1 : 0, nextApprover ? nextApprover.UserID : null], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'Proposal submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error submitting proposal: ' + error.message });
    }
});

router.post('/approve/:id', isLoggedIn, async (req, res) => {
    const proposalId = req.params.id;
    const currentUserId = req.session.user.id;

    try {
        const proposal = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM Proposals WHERE ProposalID = ?`, [proposalId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        let nextApprover = null;
        if (proposal.NextApproverUserID === currentUserId) {
            nextApprover = await determineNextApprover(req.session.user.organizationId, req.session.user.role);
            const newStatus = nextApprover ? `Pending with ${nextApprover.Role}` : 'Approved';
            const sql = `
                UPDATE Proposals SET Status = ?, NextApproverUserID = ?, LastUpdatedDate = ?
                WHERE ProposalID = ?
            `;
            await new Promise((resolve, reject) => {
                db.run(sql, [newStatus, nextApprover ? nextApprover.UserID : null, new Date().toISOString(), proposalId], function (err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            res.json({ success: true, message: 'Proposal approved successfully' });
        } else {
            res.status(403).json({ error: 'You are not authorized to approve this proposal' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error approving proposal: ' + error.message });
    }
});

router.get('/myApprovals', isLoggedIn, (req, res) => {
    const userId = req.session.user.id;
    const sql = `SELECT * FROM Proposals WHERE NextApproverUserID = ?`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ success: false, error: 'Database error: ' + err.message });
            return;
        }
        res.json({ success: true, proposals: rows });
    });
});

router.get('/api/proposals', isLoggedIn, async (req, res) => {
    try {
        const userID = req.session.user.id;
        const sql = 'SELECT * FROM Proposals WHERE SubmittedByUserID = ?';
        db.all(sql, [userID], (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            res.json({ success: true, proposals: rows });
        });
    } catch (error) {
        console.error('Failed to fetch proposals:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
    }
});

module.exports = router;
