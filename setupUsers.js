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
        //Colege-wide Orgs
        { username: "casso_president", role: "President", password: "cassopresident1234", organizationId: 2, departmentId: null },
        { username: "casso_adviser", role: "Adviser", password: "cassoadviser1234", organizationId: 2, departmentId: null },
        //Department Orgs
        { username: "cs_head", role: "Head", password: "cshead1234", organizationId: 3, departmentId: 1 },
        { username: "cs_adviser", role: "Adviser", password: "csadviser1234", organizationId: 3, departmentId: 1 },
        // Add Deans
        { username: "dean_cas", role: "Dean", password: "deanpass1234", collegeId: 1 },

    ];
    users.forEach(user => {
        db.get("SELECT UserID FROM Users WHERE Username = ?", [user.username], (err, row) => {
            if (err) {
                console.error('Error checking for existing user: ' + err.message);
                return;
            }
            if (row) {
                console.log(`User ${user.username} already exists. Skipping creation.`);
                return;
            }

            bcrypt.hash(user.password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password: ' + err.message);
                    return;
                }
                const { username, role, collegeId, organizationId, departmentId } = user;
                let roleId = null;

                db.get("SELECT RoleID FROM Roles WHERE Title = ?", [role], (err, row) => {
                    if (err) {
                        console.error('Error retrieving role ID: ' + err.message);
                        return;
                    }
                    if (row) {
                        roleId = row.RoleID;

                        db.run(
                            "INSERT INTO Users (Username, Password, RoleID, OrganizationID) VALUES (?, ?, ?, ?)",
                            [username, hashedPassword, roleId, organizationId],
                            function (err) {
                                if (err) {
                                    console.error('Error inserting user: ' + err.message);
                                    return;
                                }
                                console.log(`Inserted user ${username} with role ${role}`);
                                if (role === "Dean") {
                                    const userId = this.lastID;
                                    db.run(
                                        "UPDATE Colleges SET DeanUserID = ? WHERE CollegeID = ?",
                                        [userId, collegeId],
                                        (err) => {
                                            if (err) {
                                                console.error('Error updating college: ' + err.message);
                                                return;
                                            }
                                            console.log(`Assigned Dean ${username} to CollegeID ${collegeId}`);
                                        }
                                    );
                                }
                            }
                        );
                    } else {
                        console.error('Role not found: ' + role);
                    }
                });
            });
        });
    });
}
