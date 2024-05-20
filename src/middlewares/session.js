// src/middlewares/session.js
const session = require('express-session');

module.exports = function (app) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true if using https
            httpOnly: true,
            sameSite: 'lax'
        }
    }));
};
