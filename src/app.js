const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const sessionConfig = require('./middlewares/session'); // Import session configuration
const app = express();

// Apply session configuration
sessionConfig(app);

// Make sure all static files are served correctly
app.use(express.static(path.join(__dirname, '../views')));

app.use(bodyParser.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
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