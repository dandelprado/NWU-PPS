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
        const basePath = path.join(__dirname, '../../proposal_uploads', req.session.user.organizationName);
        const userPath = path.join(basePath, `${req.session.user.lastName}_${req.session.user.firstName}`);
        fs.mkdirSync(basePath, { recursive: true });
        fs.mkdirSync(userPath, { recursive: true });
        cb(null, userPath);
    },
    filename: function (req, file, cb) {
        const newFilename = `${req.body.title.replace(/\s+/g, '_')}${path.extname(file.originalname)}`;
        cb(null, newFilename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    }
});

async function determineNextApprover(organizationId, currentApproverRole) {
    try {
        const org = await new Promise((resolve, reject) => {
            db.get(`SELECT CollegeID, DepartmentID FROM Organizations WHERE OrganizationID = ?`, [organizationId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    reject(new Error('Organization not found'));
                } else {
                    resolve(row);
                }
            });
        });

        if (currentApproverRole === 'Adviser' || !currentApproverRole) {
            return await new Promise((resolve, reject) => {
                db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Adviser') AND OrganizationID = ?`, [organizationId], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        if (currentApproverRole === 'Adviser') {
            if (org.DepartmentID) {
                return await new Promise((resolve, reject) => {
                    db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Head') AND DepartmentID = ?`, [org.DepartmentID], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
            } else if (org.CollegeID) {
                return await new Promise((resolve, reject) => {
                    db.get(`SELECT DeanUserID FROM Colleges WHERE CollegeID = ?`, [org.CollegeID], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
            } else {
                return await new Promise((resolve, reject) => {
                    db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'OSA')`, [], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
            }
        }

        if (currentApproverRole === 'Head' || currentApproverRole === 'Dean') {
            return await new Promise((resolve, reject) => {
                db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'OSA')`, [], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        if (currentApproverRole === 'OSA') {
            if (org.FundingRequired) {
                return await new Promise((resolve, reject) => {
                    db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Finance')`, [], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
            }
            return await new Promise((resolve, reject) => {
                db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPAA')`, [], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        if (currentApproverRole === 'Finance') {
            return await new Promise((resolve, reject) => {
                db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPAA')`, [], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        if (currentApproverRole === 'VPAA') {
            return await new Promise((resolve, reject) => {
                db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'President')`, [], (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        }

        if (currentApproverRole === 'President') {
            if (org.FacilityRequired) {
                return await new Promise((resolve, reject) => {
                    db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'VPA')`, [], (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
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
    const documentPath = req.file ? path.relative(path.join(__dirname, '../../'), req.file.path) : '';

    try {
        const nextApprover = await determineNextApprover(req.session.user.organizationId, 'Adviser');

        const sql = `
            INSERT INTO Proposals (Title, SubmittedByUserID, Status, SubmissionDate, LastUpdatedDate, DocumentPath, FundingRequired, FacilityRequired, NextApproverUserID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) => {
            db.run(sql, [title, submittedByUserId, status, currentDate, currentDate, documentPath, fundingRequest ? 1 : 0, facilityRequest ? 1 : 0, nextApprover ? nextApprover.UserID : null], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        res.json({ success: true, message: 'Proposal submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error submitting proposal: ' + error.message });
    }
});

router.get('/api/proposals', isLoggedIn, (req, res) => {
    const userId = req.session.user.id;
    const sql = `
        SELECT * FROM Proposals 
        WHERE SubmittedByUserID = ? 
        OR NextApproverUserID = ?
    `;

    db.all(sql, [userId, userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch proposals' });
        } else {
            res.json({ success: true, proposals: rows });
        }
    });
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

router.post('/submit-comment/:id', isLoggedIn, (req, res) => {
    const proposalId = req.params.id;
    const userId = req.session.user.id;
    const { comment } = req.body;
    const timestamp = new Date().toISOString();
    const sql = `
        INSERT INTO ProposalsLog (ProposalID, UserID, Comment, Timestamp)
        VALUES (?, ?, ?, ?)`;
    db.run(sql, [proposalId, userId, comment, timestamp], function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to submit comment' });
        } else {
            res.json({ success: true, message: 'Comment submitted successfully' });
            // Trigger notification logic here
        }
    });
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

router.get('/api/proposals/:id/comments', isLoggedIn, (req, res) => {
    const proposalId = req.params.id;
    const sql = `
        SELECT Comment, Timestamp, 
               (SELECT Username FROM Users WHERE UserID = ProposalsLog.UserID) AS Username
        FROM ProposalsLog 
        WHERE ProposalID = ? 
        ORDER BY Timestamp DESC`;
    db.all(sql, [proposalId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to fetch comments' });
        } else {
            res.json({ success: true, comments: rows });
        }
    });
});

module.exports = router;