// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();

// Function to initialize session after login
function startSession(req, user, redirectUrl, res) {
    req.session.user = {
        id: user.UserID,
        username: user.Username,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.RoleID,
        passwordChanged: user.PasswordChanged,
        infoCompleted: user.InfoCompleted,
        organizationName: user.OrganizationName
    };
    req.session.save(err => {
        if (!err) {
            res.json({ success: true, message: 'Logged in successfully', redirectUrl: redirectUrl });
        } else {
            res.status(500).json({ error: 'Failed to save session' });
        }
    });
}
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `
        SELECT Users.*, Organizations.Name AS OrganizationName 
        FROM Users 
        LEFT JOIN Organizations ON Users.OrganizationID = Organizations.OrganizationID 
        WHERE Users.Username = ?
    `;
    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (bcrypt.compareSync(password, user.Password)) {
            let redirectUrl = '/changePassword.html';
            if (user.PasswordChanged && !user.InfoCompleted) {
                redirectUrl = '/updateInfo.html';
            } else if (user.PasswordChanged && user.InfoCompleted) {
                redirectUrl = '/dashboard.html';
            }
            startSession(req, user, redirectUrl, res);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

router.post('/change-password', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(403).json({ error: 'Unauthorized request' });
    }

    const { newPassword } = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const userId = req.session.user.id;

    db.run('UPDATE Users SET Password = ?, PasswordChanged = 1 WHERE UserID = ?', [hashedPassword, userId], function (err) {
        if (err) {
            console.error('Failed to update password:', err);
            return res.status(500).json({ error: 'Failed to update password' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.session.user.passwordChanged = true;
        res.json({ success: true, message: 'Password updated successfully', redirectUrl: '/updateInfo.html' });
    });
});

router.post('/update-profile', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(403).json({ error: 'Unauthorized request' });
    }

    const { firstName, lastName } = req.body;
    const userId = req.session.user.id;

    db.run('UPDATE Users SET FirstName = ?, LastName = ?, InfoCompleted = 1 WHERE UserID = ?', [firstName, lastName, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        req.session.user.infoCompleted = true;
        req.session.destroy(err => {
            if (err) {
                console.error('Failed to destroy session:', err);
                return res.status(500).json({ error: 'Failed to reset session' });
            }
            res.json({ success: true, message: 'Profile updated successfully', redirectUrl: '/login.html' });
        });
    });
});

router.get('/user-info', (req, res) => {
    if (req.session && req.session.user) {
        const userInfo = {
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            username: req.session.user.username,
            role: req.session.user.role,
            organizationName: req.session.user.organizationName
        };
        res.json({ success: true, data: userInfo });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

router.get('/session-status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            isLoggedIn: true,
            passwordChanged: req.session.user.passwordChanged,
            infoCompleted: req.session.user.infoCompleted
        });
    } else {
        res.json({ isLoggedIn: false });
    }
});

router.get('/organization-info', (req, res) => {
    if (req.session && req.session.user && req.session.user.organizationName) {
        res.json({ success: true, organizationName: req.session.user.organizationName });
    } else {
        res.status(401).json({ error: 'Unauthorized or no organization data' });
    }
});

router.get('/api/proposals', async (req, res) => {
    try {
        const { id: userID } = req.session.user;
        db.all(`SELECT * FROM Proposals WHERE SubmittedByUserID = ?`, [userID], (err, rows) => {
            if (err) {
                throw err;
            }
            res.json({ success: true, proposals: rows });
        });
    } catch (error) {
        console.error('Failed to fetch proposals:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
    }
});

router.get('/api/proposals/myApprovals', (req, res) => {
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

module.exports = router;
