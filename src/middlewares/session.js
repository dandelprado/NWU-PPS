// session.js
const session = require('express-session');

module.exports = function (app) {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: false,  // Changed to false to not create session until something is stored
        cookie: {
            secure: false,
            httpOnly: true,  // Mitigate XSS by not allowing client-side script to access the cookie
            sameSite: 'lax'  // Strict might prevent cookies being sent on initial request in some scenarios
        }
    }));
};
