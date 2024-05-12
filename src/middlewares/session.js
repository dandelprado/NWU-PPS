// session.js
const session = require('express-session');

module.exports = function (app) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: false,  // Changed to false to not create session until something is stored
        cookie: {
            secure: false,
            httpOnly: true,
            sameSite: 'lax'
        }
    }));
};
