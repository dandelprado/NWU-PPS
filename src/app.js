// src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const sessionConfig = require('./middlewares/session');
const { checkRole, checkNotRole } = require('./middlewares/roleCheck');
const { checkPasswordChange, checkProfileCompletion, enforceInitialSetup } = require('./middlewares/checkCompletion');
const authCheck = require('./middlewares/authCheck');
const app = express();

sessionConfig(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);

// Apply the authentication middleware to all routes except for login and styles.css
app.use(authCheck);

app.use('/proposals', proposalRoutes);
app.use(express.static(path.join(__dirname, '../views')));

app.use('/changePassword.html', checkPasswordChange);
app.use('/updateInfo.html', checkProfileCompletion);

app.get('/', enforceInitialSetup, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    const role = req.session.user.role;
    if (role === 7 || role === 5) {
        return res.sendFile(path.join(__dirname, '../views/dashboard.html'));
    } else {
        return res.sendFile(path.join(__dirname, '../views/approverDashboard.html'));
    }
});

app.get('/dashboard.html', enforceInitialSetup, checkNotRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/approverDashboard.html', enforceInitialSetup, checkRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/approverDashboard.html'));
});

app.get('/changePassword.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/changePassword.html'));
});

app.get('/updateInfo.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/updateInfo.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
