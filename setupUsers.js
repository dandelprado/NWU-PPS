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
        //Admins
        { username: "osa_admin", role: "OSA", password: "osaadmin1234", organizationId: null, departmentId: null },
        { username: "vpaa_admin", role: "VPAA", password: "vpaaadmin1234", organizationId: null, departmentId: null },
        { username: "finance_admin", role: "Finance", password: "financeadmin1234", organizationId: null, departmentId: null },
        { username: "president_admin", role: "University President", password: "presidentadmin1234", organizationId: null, departmentId: null },
        { username: "vpa_admin", role: "VPA", password: "vpaadmin1234", organizationId: null, departmentId: null },
        //Orgs
        { username: "ssc_president", role: "President", password: "sscpresident1234", organizationId: null, departmentId: null },
        { username: "ssc_adviser", role: "Adviser", password: "sscadviser1234", organizationId: null, departmentId: null },
        { username: "thereview_eic", role: "Editor-in-Chief", password: "therevieweic1234", organizationId: null, departmentId: null },
        { username: "thereview_adviser", role: "Adviser", password: "thereviewadviser1234", organizationId: null, departmentId: null },
        //Colege-wide Orgs
        { username: "casso_president", role: "President", password: "cassopresident1234", organizationId: 2, departmentId: null },
        { username: "casso_adviser", role: "Adviser", password: "cassoadviser1234", organizationId: 2, departmentId: null },
        { username: "cobeso_president", role: "President", password: "cobesopresident1234", organizationId: 6, departmentId: null },
        { username: "cobeso_adviser", role: "Adviser", password: "cobesoadviser1234", organizationId: 6, departmentId: null },
        { username: "cahsso_president", role: "President", password: "cahssopresident1234", organizationId: 7, departmentId: null },
        { username: "cahsso_adviser", role: "Adviser", password: "cahssoadviser1234", organizationId: 7, departmentId: null },
        { username: "cihtmso_president", role: "President", password: "cihtmsopresident1234", organizationId: 8, departmentId: null },
        { username: "cihtmso_adviser", role: "Adviser", password: "cihtmsoadviser1234", organizationId: 8, departmentId: null },
        { username: "ccjeso_president", role: "President", password: "ccjesopresident1234", organizationId: 9, departmentId: null },
        { username: "ccjeso_adviser", role: "Adviser", password: "ccjesoadviser1234", organizationId: 9, departmentId: null },
        { username: "comeso_president", role: "President", password: "comesopresident1234", organizationId: 10, departmentId: null },
        { username: "comeso_adviser", role: "Adviser", password: "comesoadviser1234", organizationId: 10, departmentId: null },
        { username: "cteso_president", role: "President", password: "ctesopresident1234", organizationId: 11, departmentId: null },
        { username: "cteso_adviser", role: "Adviser", password: "ctesoadviser1234", organizationId: 11, departmentId: null },
        //Department Orgs
        { username: "cs_head", role: "Head", password: "cshead1234", organizationId: 3, departmentId: 1 },
        { username: "cs_adviser", role: "Adviser", password: "csadviser1234", organizationId: 3, departmentId: 1 },
        { username: "ps_head", role: "Head", password: "pshead1234", organizationId: 4, departmentId: 2 },
        { username: "ps_adviser", role: "Adviser", password: "psadviser1234", organizationId: 4, departmentId: 2 },
        { username: "bio_head", role: "Head", password: "biohead1234", organizationId: 5, departmentId: 3 },
        { username: "bio_adviser", role: "Adviser", password: "bioadviser1234", organizationId: 5, departmentId: 3 },
        { username: "psych_head", role: "Head", password: "psychhead1234", organizationId: 12, departmentId: 4 }

    ];

    users.forEach(user => {
        // First, let's fetch the RoleID
        db.get('SELECT RoleID FROM Roles WHERE Title = ?', [user.role], (err, roleRow) => {
            if (err) {
                console.error('Error fetching role for ' + user.username + ': ' + err.message);
                return;
            }
            if (!roleRow) {
                console.error(`Role not found for ${user.role}. Skipping user ${user.username}.`);
                return;
            }

            const roleID = roleRow.RoleID;
            const hashedPassword = bcrypt.hashSync(user.password, 10);

            // Check if user already exists
            db.get('SELECT * FROM Users WHERE Username = ?', [user.username], (err, userRow) => {
                if (err) {
                    console.error('Error checking user: ' + err.message);
                    return;
                }
                if (userRow) {
                    console.log(`User ${user.username} already exists. Skipping.`);
                } else {
                    // Insert the new user
                    db.run(`INSERT INTO Users (Username, Password, RoleID, OrganizationID, PasswordChanged, InfoCompleted) VALUES (?, ?, ?, ?, FALSE, FALSE)`,
                        [user.username, hashedPassword, roleID, user.organizationId], (err) => {
                            if (err) {
                                console.error('Insert error for user ' + user.username + ': ' + err.message);
                                return;
                            }
                            console.log(`User ${user.username} added successfully.`);
                        });
                }
            });
        });
    });
} 