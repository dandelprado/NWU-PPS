function authCheck(req, res, next) {
    // Allow access to login page and styles.css without authentication
    if (req.path === '/login.html' || req.path === '/styles.css' || req.path.startsWith('/auth')) {
        return next();
    }
    if (req.session.user) {
        return next();
    } else {
        return res.redirect('/login.html');
    }
}

module.exports = authCheck;
