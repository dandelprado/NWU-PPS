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

// Function to determine the next approver based on organization type
async function determineNextApprover(organizationId) {
    try {
        const org = await db.get(`SELECT CollegeID, DepartmentID FROM Organizations WHERE OrganizationID = ?`, [organizationId]);
        if (org.DepartmentID) {
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'Head') AND DepartmentID = ?`, [org.DepartmentID]);
        } else if (org.CollegeID) {
            return await db.get(`SELECT DeanUserID FROM Colleges WHERE CollegeID = ?`, [org.CollegeID]);
        } else {
            return await db.get(`SELECT UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE Title = 'OSA')`);
        }
    } catch (error) {
        console.error('Error determining next approver:', error);
        throw error;
    }
}


// Submit a new proposal with file
router.post('/submit', isLoggedIn, upload.single('fileUpload'), async (req, res) => {
    console.log(req.body);
    const { title, fundingRequest, facilityRequest, details } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const submittedByUserId = req.session.user.id;
    const status = 'Pending with Adviser';
    const currentDate = new Date().toISOString();
    const documentPath = req.file ? req.file.path : '';

    try {
        const nextApprover = await determineNextApprover(req.session.user.organizationId);

        const sql = `
            INSERT INTO Proposals (Title, SubmittedByUserID, Status, SubmissionDate, LastUpdatedDate, DocumentPath, FundingRequired, FacilityRequired, NextApproverUserID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.run(sql, [title, submittedByUserId, status, currentDate, currentDate, documentPath, fundingRequest ? 1 : 0, facilityRequest ? 1 : 0, nextApprover.UserID]);

        res.json({ success: true, message: 'Proposal submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error submitting proposal: ' + error.message });
    }
});

module.exports = router;
