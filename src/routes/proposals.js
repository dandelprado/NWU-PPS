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

// Submit a new proposal with file
router.post('/submit', isLoggedIn, upload.single('fileUpload'), (req, res) => {
    console.log(req.body);
    const { title, fundingRequest, facilityRequest, details } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const submittedByUserId = req.session.user.id;
    const status = 'Pending with Adviser';
    const currentDate = new Date().toISOString();
    const documentPath = req.file ? req.file.path : '';

    const sql = `
        INSERT INTO Proposals (Title, SubmittedByUserID, Status, SubmissionDate, LastUpdatedDate, DocumentPath, FundingRequired, FacilityRequired)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [title, submittedByUserId, status, currentDate, currentDate, documentPath, fundingRequest ? 1 : 0, facilityRequest ? 1 : 0], function (err) {
        if (err) {
            res.status(500).json({ error: 'Error submitting proposal: ' + err.message });
            return;
        }
        res.json({ success: true, message: 'Proposal submitted successfully', proposalId: this.lastID });
    });
});


module.exports = router;
