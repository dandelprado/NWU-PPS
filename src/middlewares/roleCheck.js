const ROLE_IDS = {
    'President': 7,
    'Editor-in-Chief': 5,
    'Approver': [1, 2, 3, 4, 6, 8, 9, 10]
};

function checkRole(role) {
    return function (req, res, next) {
        if (req.session.user && ROLE_IDS[role].includes(req.session.user.role)) {
            return next();
        } else {
            res.redirect('/');
        }
    };
}

function checkNotRole(role) {
    return function (req, res, next) {
        if (req.session.user && !ROLE_IDS[role].includes(req.session.user.role)) {
            return next();
        } else {
            res.redirect('/');
        }
    };
}

module.exports = { checkRole, checkNotRole };
