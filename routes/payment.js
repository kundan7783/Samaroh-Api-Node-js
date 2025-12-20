const express = require("express");
const router = express.Router();
const pool = require("../db");
const Razorpay  = require('razorpay');
const crypto = require("crypto");


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
  });

  router.post('/create-order', async (req, res, next) => {
    try {
      const { booking_uid } = req.body;
  
      const [rows] = await pool.query(
        "SELECT total_amount, payment_status FROM bookings WHERE booking_uid = ?",
        [booking_uid]
      );
  
      if (rows.length === 0)
        return res.status(404).json({ success: false, message: "Booking not found" });
  
      if (rows[0].payment_status === "paid")
        return res.status(400).json({ success: false, message: "Payment already done" });
  
      const totalAmount = Number(rows[0].total_amount);
  
      // 🔹 20% advance
      const advanceAmount = Math.round(totalAmount * 0.20 * 100); // Razorpay (paise)
      const advancePaid = advanceAmount / 100;                    // DB (₹)
      const remainingAmount = totalAmount - advancePaid;
  
      const order = await razorpay.orders.create({
        amount: advanceAmount,
        currency: "INR",
        receipt: booking_uid
      });
  
      await pool.query(
        `
        INSERT INTO payments 
        (booking_uid, total_amount, advance_paid, remaining_amount, payment_percent, razorpay_order_id, payment_status)
        VALUES (?, ?, ?, ?, 20, ?, 'pending')
        ON DUPLICATE KEY UPDATE
          razorpay_order_id = VALUES(razorpay_order_id),
          advance_paid = VALUES(advance_paid),
          remaining_amount = VALUES(remaining_amount)
        `,
        [
          booking_uid,
          totalAmount,
          advancePaid,
          remainingAmount,
          order.id
        ]
      );
  
      res.json({
        success: true,
        order_id: order.id,
        amount: advanceAmount,
        currency: "INR"
      });
  
    } catch (error) {
      next(error);
    }
  });
  

  router.post('/verify-payment', async (req, res, next) => {
    try {
      const {
        booking_uid,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;
  
      const body = razorpay_order_id + "|" + razorpay_payment_id;
  
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid signature"
        });
      }
  
      // 🔹 Get total_amount from payments table
      const [paymentRows] = await pool.query(
        "SELECT total_amount FROM payments WHERE booking_uid = ?",
        [booking_uid]
      );
  
      if (paymentRows.length === 0) {
        return res.status(404).json({ success: false, message: "Payment record not found" });
      }
  
      const totalAmount = paymentRows[0].total_amount;
      const advancePaid = totalAmount * 0.20;
      const remainingAmount = totalAmount - advancePaid;
  
      // 🔹 Update payments table
      await pool.query(
        `UPDATE payments SET 
          razorpay_payment_id = ?,
          transaction_id = ?,
          razorpay_signature = ?,
          payment_status = 'paid',
          advance_paid = ?,
          remaining_amount = ?,
          payment_date = NOW()
        WHERE booking_uid = ?`,
        [
          razorpay_payment_id,
          razorpay_payment_id,
          razorpay_signature,
          advancePaid,
          remainingAmount,
          booking_uid
        ]
      );
  
      // 🔹 Update bookings table
      await pool.query(
        `UPDATE bookings 
         SET payment_status = 'paid',
             booking_status = 'confirmed'
         WHERE booking_uid = ?`,
        [booking_uid]
      );
  
      res.json({
        success: true,
        message: "Payment verified & booking confirmed"
      });
  
    } catch (error) {
      next(error);
    }
  });
  


module.exports = router;