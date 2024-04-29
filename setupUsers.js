// setupUsers.js
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nwuPPS.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
        return;
    }
    console.log('Connected to the NWU-PPS database.');
    createUsers();
});

function createUsers() {
    const users = [
        { username: "osa_admin", role: "OSA", password: "osa1234" },
        { username: "finance_admin", role: "Finance", password: "finance1234" },
        { username: "dean_cas", role: "Dean", password: "deancas1234" },
        { username: "pres_casso", role: "President", password: "prescasso1234" },
        // Add other users here...
    ];

    users.forEach(user => {
        db.get('SELECT * FROM Users WHERE Username = ?', [user.username], (err, row) => {
            if (err) {
                console.error('Error checking user: ' + err.message);
                return;
            }

            if (row) {
                // User already exists
                console.log(`User ${user.username} already exists. Skipping.`);
            } else {
                // User does not exist, insert new user
                const hashedPassword = bcrypt.hashSync(user.password, 10);
                db.run(`INSERT INTO Users (Username, Password, RoleID, PasswordChanged, InfoCompleted) VALUES (?, ?, (SELECT RoleID FROM Roles WHERE Title = ?), FALSE, FALSE)`, [user.username, hashedPassword, user.role], function (err) {
                    if (err) {
                        console.error('Insert error for user ' + user.username + ': ' + err.message);
                        return;
                    }
                    console.log(`User ${user.username} added successfully.`);
                });
            }
        });
    });
}

