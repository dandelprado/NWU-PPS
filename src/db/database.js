const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../nwuPPS.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the NWU-PPS database.');
  }
});

db.serialize(() => {
  db.run("BEGIN TRANSACTION");
  db.run('UPDATE Users SET Password = ?, PasswordChanged = 1 WHERE UserID = ?', [hashedPassword, userId], function (err) {
    if (err) {
      db.run("ROLLBACK");
      console.error('Failed to update password:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log(`Rows affected: ${this.changes}`);
    req.session.user.passwordChanged = true;
    db.run("COMMIT");
    res.json({ success: true, message: 'Password updated successfully', redirectUrl: '/updateInfo.html' });
  });
});


module.exports = db;