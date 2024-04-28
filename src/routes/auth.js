const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();

// Function to initialize session after login
function startSession(req, user, redirectUrl, res) {
    req.session.user = {
        id: user.UserID,
        username: user.Username,
        role: user.RoleID,
        passwordChanged: user.PasswordChanged,
        infoCompleted: user.InfoCompleted
    };
    req.session.save(err => {
        if (!err) {
            res.json({ success: true, message: 'Logged in successfully', redirectUrl: redirectUrl });
        } else {
            res.status(500).json({ error: 'Failed to save session' });
        }
    });
}

// Handle login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM Users WHERE Username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (bcrypt.compareSync(password, user.Password)) {
            let redirectUrl = '/dashboard.html';
            if (!user.PasswordChanged) {
                redirectUrl = '/changePassword.html';
            } else if (!user.InfoCompleted) {
                redirectUrl = '/updateInfo.html';
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

    db.run('UPDATE Users SET Password = ?, PasswordChanged = 1 WHERE UserID = ?', [hashedPassword, userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        req.session.user.passwordChanged = true;
        req.session.save(err => {
            if (err) {
                res.status(500).json({ error: 'Failed to save session' });
            } else {
                res.json({ success: true, message: 'Password updated successfully', redirectUrl: '/updateInfo.html' });
            }
        });
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
        req.session.save(err => {
            if (!err) {
                res.json({ success: true, message: 'Profile updated successfully', redirectUrl: '/dashboard.html' });
            } else {
                res.status(500).json({ error: 'Failed to save session' });
            }
        });
    });
});

module.exports = router;
