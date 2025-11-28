const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAuthToken = require("../middleware/authHandeler");
const upload = require("../controllers/image_upload_controller"); // tumhara multer config


// ⭐ ADD RATING API
router.post("/:banquet_id", verifyAuthToken, upload.array("images", 4), async (req, res, next) => {
    try {
        const { banquet_id } = req.params;

        const phone_number = req.user.phone_number;

        // GET USER_ID FROM DATABASE
        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

        if (userRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const userId = userRows[0].user_id;   // ⭐ FIXED

        const { rating, review_text } = req.body;

        if (!rating) {
            return res.status(400).json({
                success: false,
                message: "Rating is required"
            });
        }

        // IMAGES HANDLING
        let images = null;

        if (req.files && req.files.length > 0) {
            images = JSON.stringify(req.files.map(file => file.filename));
        }

        // INSERT DATA INTO DATABASE
        const [result] = await pool.query(
            `INSERT INTO ratings (banquet_id, user_id, rating, review_text, images)
             VALUES (?, ?, ?, ?, ?)`,
            [banquet_id, userId, rating, review_text, images]   // ⭐ FIXED
        );

        res.json({
            success: true,
            message: "Rating added successfully",
            rating_id: result.insertId
        });

    } catch (error) {
        
        next(error);
    }
});


module.exports = router;
