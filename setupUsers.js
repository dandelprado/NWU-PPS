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
        { username: "osa_admin", role: "OSA", password: "osa1234", organizationId: null },
        { username: "finance_admin", role: "Finance", password: "finance1234", organizationId: null },
        { username: "dean_cas", role: "Dean", password: "deancas1234", organizationId: null },
        { username: "pres_casso", role: "President", password: "prescasso1234", organizationId: 1 },
        // Add other users soon as you get the complete list, including their organization IDs if applicable
    ];

    users.forEach(user => {
        db.get('SELECT * FROM Users WHERE Username = ?', [user.username], (err, row) => {
            if (err) {
                console.error('Error checking user: ' + err.message);
                return;
            }

            if (row) {
                console.log(`User ${user.username} already exists. Skipping.`);
            } else {
                const hashedPassword = bcrypt.hashSync(user.password, 10);
                db.run(`INSERT INTO Users (Username, Password, RoleID, OrganizationID, PasswordChanged, InfoCompleted) VALUES (?, ?, (SELECT RoleID FROM Roles WHERE Title = ?), ?, FALSE, FALSE)`,
                    [user.username, hashedPassword, user.role, user.organizationId], function (err) {
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
