const session = require('express-session');

module.exports = function (app) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_secret_key', // Use environment variable for secrets
        resave: false,
        saveUninitialized: true, // Choose based on your need for compliance or behavior
        cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in production
    }));
};
