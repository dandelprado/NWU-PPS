const express = require('express');
const db = require('../db/database');
const router = express.Router();

// GET all users
router.get('/', (req, res) => {
    db.all("SELECT * FROM Users", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

// Add additional user routes (POST, PUT, DELETE) here

module.exports = router;
