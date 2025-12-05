const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post('/',async(req,res,next)=>{
    try{

        app.post('/bookings', (req, res) => {
    const { user_id, hall_id, booking_date, time_slot, guests_count, payment_status, occasion } = req.body;

    if (!user_id || !hall_id || !booking_date || !time_slot) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const sql = `
        INSERT INTO bookings 
        (user_id, hall_id, booking_date, time_slot, guests_count, payment_status, occasion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        user_id,
        hall_id,
        booking_date,
        time_slot,
        guests_count || 0,
        payment_status || 'pending',
        occasion || 'Not Mentioned'
    ], (err, result) => {

        if (err) {
            return res.status(500).json({ message: "DB Error", error: err });
        }

        res.status(201).json({
            message: "Booking Created Successfully",
            booking_id: result.insertId
        });
    });
});


    }catch(error){
       next(error);
    }
});

router.get('/',async(req,res,next)=>{
    try{

    }catch(error){
       next(error);
    }
});

