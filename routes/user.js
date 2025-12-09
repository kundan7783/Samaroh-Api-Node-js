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
      const { first_name, last_name, email, district } = req.body;
      const phone_number = req.user.phone_number;

      const [authRows] = await myDB.query(
          "SELECT user_id FROM authentications WHERE phone_number = ?",
          [phone_number]
      );

      if (authRows.length > 0 && authRows[0].user_id !== null) {
          return res.status(400).json({
              message: "Profile already completed. You cannot create again."
          });
      }

      // Insert user
      const [result] = await myDB.query(
          "INSERT INTO users (first_name, last_name, email, district) VALUES (?, ?, ?, ?)",
          [first_name, last_name, email, district]
      );

      const userId = result.insertId;

      // Update authentications table
      await myDB.query(
          "UPDATE authentications SET user_id = ? WHERE phone_number = ?",
          [userId, phone_number]
      );

      // Fetch user without image (image null hogi)
      const [userData] = await myDB.query(
          "SELECT id, first_name, last_name, email, district, image FROM users WHERE id = ?",
          [userId]
      );

      return res.status(201).json({
          message: "Account completed successfully",
          ...userData[0]
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
router.put('/:id', verifyToken, upload.single("image"), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { first_name, last_name, email,district} = req.body;

    const newImage = req.file ? req.file.filename : null;

    // 1️⃣ Check if user exists
    const [rows] = await myDB.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // 2️⃣ Old image delete (only if new uploaded)
    if (newImage && user.image) {
      const oldImagePath = path.join(__dirname, "../uploades_images", user.image);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      } else {
        console.log("⚠ Old image does not exist, skip:", user.image);
      }
    }

    // 3️⃣ Decide new or old image
    const finalImage = newImage ? newImage : user.image;

    // 4️⃣ Update user
    await myDB.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, district = ?, image = ?
       WHERE id = ?`,
      [first_name, last_name, email, district, finalImage, id]
    );

    // 5️⃣ Return updated data
    return res.status(200).json({
      id,
      first_name,
      last_name,
      email,
      district,
      image: finalImage,
      message :"Profile updated successfully",
    });

  } catch (error) {
    next(error);
  }
});







module.exports = router;