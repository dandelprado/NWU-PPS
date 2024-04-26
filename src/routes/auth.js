const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const router = express.Router();

// Helper function to start a session
function startSession(req, user, res) {
    req.session.user = {
        id: user.UserID,
        username: user.Username,
        role: user.RoleID
    };
    res.send({
        success: true,
        message: 'Logged in successfully',
        firstLogin: !user.PasswordChanged,
        profileIncomplete: !user.InfoCompleted
    });
}

// Login Route
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
            if (!user.PasswordChanged) {
                // Password needs to be changed and profile needs to be completed
                res.json({ changePassword: true, profileIncomplete: !user.InfoCompleted });
            } else {
                // Start the user session
                startSession(req, user, res);
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Combined Password Change and Profile Update Route
router.post('/change-password-and-update-profile', (req, res) => {
    const { userId, newPassword, firstName, lastName } = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required' });
    }

    db.run(`UPDATE Users SET Password = ?, FirstName = ?, LastName = ?, PasswordChanged = TRUE, InfoCompleted = TRUE WHERE UserID = ?`, [hashedPassword, firstName, lastName, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ success: true, message: 'Password updated and profile completed successfully' });
    });
});

module.exports = router;
