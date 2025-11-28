const express = require('express');
const verifyToken = require('../middleware/authHandeler');
const myDB = require('../db');
const router = express.Router();


/// Put => update user
router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { first_name, last_name, email } = req.body;
        const phone_number = req.user.phone_number;
        const [result] = await myDB.query(
            "INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)",
            [first_name, last_name, email]
        );
        const userId = result.insertId;


        await myDB.query(
            "UPDATE authentications SET user_id = ? WHERE phone_number = ?",
            [userId, phone_number]
        );

        res.status(201).json({
            message: "Account completed successfully",
            userId: userId
        });

    } catch (error) {
        next(error);
    }
});

/// Get => get one user
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await myDB.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

/// Put => update user
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email } = req.body;


        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: "All fields are required for PUT" });
        }

        const [result] = await myDB.query(
            "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
            [first_name, last_name, email, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User fully updated" });

    } catch (error) {
        next(error);
    }
});



module.exports = router;