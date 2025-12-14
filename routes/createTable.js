const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post('/setup/create-booking-payment-tables', async (req, res, next) => {
    try {
  
      // 🔹 BOOKINGS TABLE
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_uid VARCHAR(50) UNIQUE,
  
          user_id INT,
          banquet_id INT,
  
          booking_date DATE,
          total_guest INT,
          total_room INT,
          event_type VARCHAR(50),
          food_type VARCHAR(50),
  
          price_per_plate DECIMAL(10,2),
          food_subtotal DECIMAL(10,2),
          room_charge DECIMAL(10,2),
          total_amount DECIMAL(10,2),
  
          booking_status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (banquet_id) REFERENCES banquets(id)
        )
      `);
  
      // 🔹 PAYMENTS TABLE
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_uid VARCHAR(50),
  
          advance_paid DECIMAL(10,2),
          remaining_amount DECIMAL(10,2),
  
          transaction_id VARCHAR(100),
          payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
          payment_date DATETIME,
  
          FOREIGN KEY (booking_uid) REFERENCES bookings(booking_uid)
        )
      `);
  
      res.status(200).json({
        success: true,
        message: "Bookings & Payments tables created successfully"
      });
  
    } catch (error) {
      next(error);
    }
  });
  router.get('/setup/total-tables', async (req, res, next) => {
    try {
      const [rows] = await pool.query(`SHOW TABLES`);
  
      res.status(200).json({
        success: true,
        total_tables: rows.length,
        tables: rows
      });
  
    } catch (error) {
      next(error);
    }
  });

  module.exports = router;
  

  