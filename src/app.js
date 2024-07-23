const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const session = require('express-session');
const { checkRole, checkNotRole } = require('./middlewares/roleCheck');
const { enforceInitialSetupStep } = require('./middlewares/checkCompletion');
const authCheck = require('./middlewares/authCheck');

const app = express();

// Configure session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded proposal files
app.use('/download', express.static(path.join(__dirname, '../proposal_uploads')));

// Public routes
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.use('/auth', authRoutes);

// Apply the authentication middleware to all routes except for login and styles.css
app.use(authCheck);

// Apply the initial setup step enforcement middleware
app.use(enforceInitialSetupStep);

// Protected routes
app.get('/changePassword.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/changePassword.html'));
});

app.get('/updateInfo.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/updateInfo.html'));
});

app.get('/dashboard.html', checkNotRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/approverDashboard.html', checkRole('Approver'), (req, res) => {
    res.sendFile(path.join(__dirname, '../views/approverDashboard.html'));
});

app.get('/proposalsDashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/proposalsDashboard.html'));
});

app.get('/submitProposal.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/submitProposal.html'));
});

app.use('/proposals', proposalRoutes);

app.get('/', (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});