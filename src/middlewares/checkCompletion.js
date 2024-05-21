function enforceInitialSetupStep(req, res, next) {
    if (req.session.user) {
        if (!req.session.user.passwordChanged && req.path !== '/changePassword.html' && req.path !== '/auth/change-password') {
            return res.redirect('/changePassword.html');
        }
        if (req.session.user.passwordChanged && !req.session.user.infoCompleted && req.path !== '/updateInfo.html' && req.path !== '/auth/update-profile') {
            return res.redirect('/updateInfo.html');
        }
    }
    next();
}

module.exports = { enforceInitialSetupStep };
