const bcrypt = require('bcryptjs');

// Hash Password
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

// Verify Password
function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

module.exports = { hashPassword, verifyPassword };
