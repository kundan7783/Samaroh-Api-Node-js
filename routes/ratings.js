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

        // Get User ID
        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }

        const userId = userRows[0].user_id;

        const { rating, review_text } = req.body;

        if (!rating) {
            return res.status(400).json({ success: false, message: "Rating is required" });
        }

        // Handle Images
        let images = null;
        if (req.files && req.files.length > 0) {
            images = JSON.stringify(req.files.map(file => file.filename));
        }

        // ⭐ Step 1: Check if rating already exists
        const [existing] = await pool.query(
            "SELECT * FROM ratings WHERE banquet_id = ? AND user_id = ?",
            [banquet_id, userId]
        );

        if (existing.length > 0) {
            // ⭐ Step 2: UPDATE (Overwrite)
            await pool.query(
                `UPDATE ratings 
                 SET rating = ?, review_text = ?, images = ?
                 WHERE banquet_id = ? AND user_id = ?`,
                [rating, review_text, images, banquet_id, userId]
            );

            return res.json({
                success: true,
                message: "Rating overwritten (updated) successfully",
            });
        }

        // ⭐ Step 3: INSERT (first time rating)
        const [result] = await pool.query(
            `INSERT INTO ratings (banquet_id, user_id, rating, review_text, images)
             VALUES (?, ?, ?, ?, ?)`,
            [banquet_id, userId, rating, review_text, images]
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

router.get('/:banquet_id', verifyAuthToken, async (req, res, next) => {
    try {
        const { banquet_id } = req.params;

        const [rows] = await pool.query(
            `SELECT 
                ratings.rating,
                ratings.review_text,
                ratings.images,
                users.first_name,
                users.last_name
            FROM ratings
            JOIN users ON ratings.user_id = users.id
            WHERE ratings.banquet_id = ?
            ORDER BY ratings.rating DESC`,
            [banquet_id]
        );

        // Convert JSON string → array
        const ratings = rows.map(r => {
            let imagesArray = [];
            if (r.images) {
                try {
                    imagesArray = JSON.parse(r.images); // ✅ Proper array
                } catch (err) {
                    imagesArray = []; // agar JSON parse fail ho jaye
                }
            }

            return {
                rating: r.rating,
                review_text: r.review_text,
                images: imagesArray,
                first_name: r.first_name,
                last_name: r.last_name
            };
        });

        res.json({
            success: true,
            total_ratings: ratings.length,
            ratings: ratings
        });

    } catch (error) {
        next(error);
    }
});

router.get('/summary/:banquet_id', async (req, res, next) => {
    try {
        const { banquet_id } = req.params;
        const [rows] = await pool.query(
            `SELECT rating, COUNT(*) AS total
                FROM ratings
                WHERE banquet_id = ?
                GROUP BY rating`,
            [banquet_id]
        );
        const stars = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        rows.forEach(r => {
            stars[String(r.rating)] = r.total;
        });
        const totalReviews = Object.values(stars).reduce((acc, v) => acc + v, 0);
        let avg = 0;
        if (totalReviews > 0) {
            avg = (
                1 * stars["1"] +
                2 * stars["2"] +
                3 * stars["3"] +
                4 * stars["4"] +
                5 * stars["5"]
            ) / totalReviews;
        }

        res.json({
            success: true,
            average_rating: avg.toFixed(1), // "4.2" like your example
            total_reviews: totalReviews,
            stars: stars
        });

    } catch (error) {
        next(error);
    }
});



module.exports = router;
