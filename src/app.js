const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const authRoutes = require('./routes/auth');
const sessionMiddleware = require('./middlewares/session');

app.use(express.static(path.join(__dirname, '../views')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/changePassword.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/changePassword.html'));
});

app.get('/updateInfo.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/updateInfo.html'));
});

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' http://localhost:3000");
    next();
});

app.use(bodyParser.json());
sessionMiddleware(app); app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
