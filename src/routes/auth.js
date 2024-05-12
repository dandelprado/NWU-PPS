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
        organizationName: user.OrganizationName  // Storing organization name in session
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
    const sql = `
        SELECT Users.*, Organizations.Name AS OrganizationName 
        FROM Users 
        LEFT JOIN Organizations ON Users.OrganizationID = Organizations.OrganizationID 
        WHERE Users.Username = ?
    `;
    db.get(sql, [username], (err, user) => {
        console.log(user);
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
    const hashedPassword = bcrypt.hashSync(newPassword, 10); // Ensure password is hashed
    const userId = req.session.user.id;

    // Update the password in the database
    db.run('UPDATE Users SET Password = ?, PasswordChanged = 1 WHERE UserID = ?', [hashedPassword, userId], function (err) {
        if (err) {
            console.error('Failed to update password:', err);
            return res.status(500).json({ error: 'Failed to update password' });
        }
        if (this.changes === 0) {
            console.log('No user found or no update made');
            return res.status(404).json({ error: 'User not found' });
        }

        // Update session to reflect the password change
        req.session.user.passwordChanged = true;
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session update failed' });
            }
            res.json({ success: true, message: 'Password updated successfully', redirectUrl: '/updateInfo.html' });
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
        req.session.user.firstName = firstName;  // Update session with new first name
        req.session.user.lastName = lastName;  // Update session with new last name
        req.session.save(err => {
            if (!err) {
                res.json({ success: true, message: 'Profile updated successfully', redirectUrl: '/dashboard.html' });
            } else {
                res.status(500).json({ error: 'Failed to save session' });
            }
        });
    });
});


// Endpoint to get user info, including the organization name
router.get('/user-info', (req, res) => {
    if (req.session && req.session.user) {
        console.log('User Info:', req.session.user);
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

router.get('/organization-info', (req, res) => {
    console.log(req.session);
    if (req.session && req.session.user && req.session.user.organizationName) {
        res.json({ success: true, organizationName: req.session.user.organizationName });
    } else {
        res.status(401).json({ error: 'Unauthorized or no organization data' });
    }
});

module.exports = router;
