function clearSessionAndRedirect(req, res) {
    req.session.destroy(err => {
        if (err) {
            console.error('Failed to destroy session:', err);
            return res.status(500).send('Failed to reset session.');
        }
        return res.redirect('/login.html');
    });
}

function checkPasswordChange(req, res, next) {
    if (req.session.user && !req.session.user.passwordChanged) {
        clearSessionAndRedirect(req, res);
    } else {
        next();
    }
}

function checkProfileCompletion(req, res, next) {
    if (req.session.user && req.session.user.passwordChanged && !req.session.user.infoCompleted) {
        clearSessionAndRedirect(req, res);
    } else {
        next();
    }
}

function enforceInitialSetup(req, res, next) {
    if (req.session.user && (!req.session.user.passwordChanged || !req.session.user.infoCompleted)) {
        clearSessionAndRedirect(req, res);
    } else {
        next();
    }
}

module.exports = { checkPasswordChange, checkProfileCompletion, enforceInitialSetup };
