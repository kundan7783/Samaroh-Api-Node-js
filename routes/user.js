const express = require('express');
const fs = require('fs');
const path = require("path");
const verifyToken = require('../middleware/authHandeler');
const myDB = require('../db');
const router = express.Router();
const upload = require("../controllers/image_upload_controller"); 


/// Put => update user
router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { first_name, last_name, email } = req.body;
        const phone_number = req.user.phone_number;

    
        const [authRows] = await myDB.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

            // Agar ye phone number database me mil gaya
            // AUR
            // uska profile pehle se bana hua hai (user_id null nahi hai)

        if (authRows.length > 0 && authRows[0].user_id !== null) {
            return res.status(400).json({
                message: "Profile already completed. You cannot create again."
            });
        }

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
router.get('/:id', verifyToken, async (req, res, next) => {
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
router.patch('/:id', verifyToken, upload.single("image"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const newImage = req.file ? req.file.filename : null;

    // 1️⃣ Check if user exists
    const [rows] = await myDB.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // 2️⃣ Agar body me value nahi hai to purana data use karo
    const first_name = req.body.first_name || user.first_name;
    const last_name = req.body.last_name || user.last_name;
    const email = req.body.email || user.email;
    const image = newImage || user.image;

    // 3️⃣ Old image delete only if:
    //    ✔ newImage aaya ho
    //    ✔ old image exist karti ho
    if (newImage && user.image) {
      const oldImagePath = path.join(__dirname, "../uploades_images", user.image);

      // 🔥 Important Fix: Check existence before delete
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Old image delete karte waqt error:", err);
          } else {
            console.log("Old image deleted:", user.image);
          }
        });
      } else {
        console.log("⚠ Old image exist hi nahi karti, skip delete:", user.image);
      }
    }

    // 4️⃣ Update user
    await myDB.query(
      "UPDATE users SET first_name = ?, last_name = ?, email = ?, image = ? WHERE id = ?",
      [first_name, last_name, email, image, id]
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      data: {
        first_name,
        last_name,
        email,
        image: newImage || user.image,
      }
    });

  } catch (error) {
    next(error);
  }
});






module.exports = router;