const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const sessionConfig = require('./middlewares/session');
const { checkRole, checkNotRole } = require('./middlewares/roleCheck');
const app = express();

sessionConfig(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/proposals', proposalRoutes);

app.use(express.static(path.join(__dirname, '../views')));

app.get('/', (req, res) => {
    console.log('Root route accessed');
    if (!req.session.user) {
        console.log('No session user, redirecting to login');
        return res.sendFile(path.join(__dirname, '../views/login.html'));
    }
    const role = req.session.user.role;
    console.log('User role:', role);
    if (role === 7 || role === 5) {
        console.log('Redirecting to dashboard');
        return res.sendFile(path.join(__dirname, '../views/dashboard.html'));
    } else {
        console.log('Redirecting to approver dashboard');
        return res.sendFile(path.join(__dirname, '../views/approverDashboard.html'));
    }
});

// Ensure role-based access control
app.get('/dashboard.html', checkNotRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/approverDashboard.html', checkRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/approverDashboard.html'));
});

app.get('/changePassword.html', (req, res) => {
    if (!req.session.user || req.session.user.passwordChanged) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../views/changePassword.html'));
});

app.get('/updateInfo.html', (req, res) => {
    if (!req.session.user || !req.session.user.passwordChanged || req.session.user.infoCompleted) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../views/updateInfo.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
