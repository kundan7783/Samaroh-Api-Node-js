const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAuthToken = require("../middleware/authHandeler");

router.post("/", verifyAuthToken, async (req, res,next) => {
    try {
        const phone_number = req.user.phone_number;

        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const user_id = userRows[0].user_id;
        const { banquet_id } = req.body;

        // ⭐ Check if banquet exists
        const [banquetRows] = await pool.query(
            "SELECT id FROM banquets WHERE id = ?",
            [banquet_id]
        );

        if (banquetRows.length === 0) {
            return res.status(400).json({ success: false, message: "Banquet does not exist" });
        }

        // Check existing wishlist
        const [rows] = await pool.query(
            "SELECT * FROM wishlist WHERE user_id = ? AND banquet_id = ?",
            [user_id, banquet_id]
        );
                if (rows.length > 0) {
                            const wishlistId = rows[0].id;
                            const currentStatus = rows[0].is_wishlist;

                            const newStatus = currentStatus === 1 ? 0 : 1;

                            await pool.query(
                                "UPDATE wishlist SET is_wishlist = ? WHERE id = ?",
                                [newStatus, wishlistId]
                            );

                            return res.json({
                                success: true,
                                message: newStatus === 1 ? "Added to wishlist" : "Removed from wishlist",
                                is_wishlist: newStatus,
                                wishlist_id: wishlistId   // ⭐ same id
                            });
                        }

        await pool.query(
            "INSERT INTO wishlist (user_id, banquet_id, is_wishlist) VALUES (?, ?, 1)",
            [user_id, banquet_id]
        );

        return res.json({ success: true, message: "Added to wishlist", is_wishlist: 1 });

    } catch (error) {
        next(error);
    }
});
// GET /api/wishlist
router.get("/", verifyAuthToken, async (req, res, next) => {
    try {
        const phone_number = req.user.phone_number;

        // Get user_id
        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

        if (userRows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const user_id = userRows[0].user_id;

        // Get all liked banquets
        const [wishlist] = await pool.query(
            `SELECT w.banquet_id, b.banquet_name, b.banquet_address, b.veg_price , b.nonveg_price , b.min_capacity, b.max_capacity , b.district
             FROM wishlist w
             JOIN banquets b ON w.banquet_id = b.id
             WHERE w.user_id = ? AND w.is_wishlist = 1`,
            [user_id]
        );
        console.log(wishlist);

        return res.json({ success: true, wishlist });

    } catch (error) {
        next(error);
    }
});


module.exports = router;

