const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAuthToken = require("../middleware/authHandeler");

// 🔥 Unique Booking ID Generator
function generateUniqueBookingID(user_id) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BK${year}${month}${day}U${user_id}R${random}`;
}

router.post('/create/:banquet_id', verifyAuthToken, async (req, res, next) => {
    try {
        const phone_number = req.user.phone_number;

        // 1️⃣ Get user_id
        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );

        if (userRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        const user_id = userRows[0].user_id;
        const { banquet_id } = req.params;

        const {
            booking_date,
            total_guest,
            total_room,
            event_type,
            food_type,
            price_per_plate,
            room_charge,
            checkOnly
        } = req.body;

        // // ❌ VALIDATION
        // if (!booking_date || !total_guest || !event_type) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Required fields missing"
        //     });
        // }

        // 🔍 CHECK: Banquet already booked on same date (cancelled ignore)
        const [existingBooking] = await pool.query(
            `SELECT id FROM bookings 
             WHERE banquet_id = ? 
             AND booking_date = ?
             AND booking_status != 'cancelled'`,
            [banquet_id, booking_date]
        );

        // ⭐ Only availability check
        if (checkOnly) {
            if (existingBooking.length > 0) {
                return res.json({
                    success: false,
                    message: "This banquet is already booked for the selected date"
                });
            } else {
                return res.json({
                    success: true,
                    message: "Available"
                });
            }
        }

        // 🔹 Normal booking flow
        if (existingBooking.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This banquet is already booked for the selected date"
            });
        }

        // 4️⃣ Calculations
        const food_subtotal = total_guest * price_per_plate;
        const total_amount = food_subtotal + room_charge;

        // 5️⃣ Booking UID
        const booking_uid = generateUniqueBookingID(user_id);

        // 6️⃣ Insert booking
        await pool.query(
            `INSERT INTO bookings (
                booking_uid,
                user_id,
                banquet_id,
                booking_date,
                total_guest,
                total_room,
                event_type,
                food_type,
                price_per_plate,
                food_subtotal,
                room_charge,
                total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                booking_uid,
                user_id,
                banquet_id,
                booking_date,
                total_guest,
                total_room,
                event_type,
                food_type,
                price_per_plate,
                food_subtotal,
                room_charge,
                total_amount
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking_id: booking_uid,
            total_amount,
            payment_status: "pending"
        });

    } catch (error) {
        next(error);
    }
});


router.get('/all/booking', verifyAuthToken, async (req, res, next) => {
    try {
      const phone_number = req.user.phone_number;
  
      // 1️⃣ Get user_id
      const [userRows] = await pool.query(
        "SELECT user_id FROM authentications WHERE phone_number = ?",
        [phone_number]
      );
      if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: "User not found" });
      }
      const user_id = userRows[0].user_id;
  
      // 2️⃣ Get all bookings for this user
      const [rows] = await pool.query(
        `
        SELECT 
          bk.booking_uid,
          b.banquet_name,
          b.banquet_address,
          b.min_capacity,
          b.max_capacity,
          b.images
        FROM bookings AS bk
        INNER JOIN banquets AS b 
          ON bk.banquet_id = b.id
        WHERE bk.user_id = ?
        `,
        [user_id]
      );
  
      // 3️⃣ Format images for each booking
      const formattedBookings = rows.map(item => ({
        booking_uid: item.booking_uid,
        banquet_name: item.banquet_name,
        banquet_address: item.banquet_address,
        min_capacity: item.min_capacity,
        max_capacity: item.max_capacity,
        images: item.images ? [item.images.split(",")[0]] : []
      }));
  
      res.status(200).json(formattedBookings);
  
    } catch (error) {
      next(error);
    }
  });



router.get('/details/:booking_uid', verifyAuthToken,async (req, res, next) => {
    try {
         const phone_number = req.user.phone_number;
        const { booking_uid } = req.params;

        // 1️⃣ Get user_id
        const [userRows] = await pool.query(
            "SELECT user_id FROM authentications WHERE phone_number = ?",
            [phone_number]
        );
        if (userRows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        const user_id =  userRows[0].user_id;

        // 2️⃣ Get booking + banquet + payment (LEFT JOIN)
        const [rows] = await pool.query(
            `
            SELECT
                banquets.id,
                banquets.images,    
                banquets.banquet_name,
                banquets.banquet_address,
                
                
                bookings.booking_date,
                bookings.total_guest,
                bookings.booking_uid AS booking_id,
                bookings.event_type,
                bookings.total_room,
                bookings.food_type,
                bookings.price_per_plate,
                bookings.food_subtotal,
                bookings.room_charge,
                bookings.total_amount,
                bookings.created_at,

                payments.advance_paid,
                payments.remaining_amount,
                payments.transaction_id,
                payments.payment_status,
                payments.payment_date

            FROM bookings 
            JOIN banquets ON bookings.banquet_id = banquets.id
            LEFT JOIN payments ON bookings.booking_uid = payments.booking_uid
            WHERE bookings.user_id = ? AND bookings.booking_uid = ?
            `,
            [user_id, booking_uid]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const booking = rows[0];

        // 🔹 Images array with only first image
        if (booking.images) {
            const imgArray = booking.images.split(",");  // agar comma separated
            booking.images = [imgArray[0]];  // first image as array
        } else {
            booking.images = []; // agar image nahi hai
        }

        // 🔹 Default payment values agar record nahi hai
        if (!booking.payment_status) {
            booking.advance_paid = booking.advance_paid ?? 0;
            booking.remaining_amount = booking.remaining_amount ?? booking.total_amount;
            booking.transaction_id = booking.transaction_id ?? null;
            booking.payment_status = booking.payment_status ?? "pending";
            booking.payment_date = booking.payment_date ?? null;            
        }

        return res.status(200).json(booking);

    } catch (error) {
        next(error);
    }
});

router.post('/cancel/:booking_uid', verifyAuthToken, async (req, res, next) => {
  try {
    const phone_number = req.user.phone_number;
    const { booking_uid } = req.params;
    const { cancel_reason } = req.body;

    // 1️⃣ Get user_id
    const [userRows] = await pool.query(
      "SELECT user_id FROM authentications WHERE phone_number = ?",
      [phone_number]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user_id = userRows[0].user_id;

    // 2️⃣ Check booking exists & belongs to user
    const [bookingRows] = await pool.query(
      `SELECT booking_status, payment_status 
       FROM bookings 
       WHERE booking_uid = ? AND user_id = ?`,
      [booking_uid, user_id]
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // 3️⃣ Already cancelled?
    if (bookingRows[0].booking_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Booking already cancelled"
      });
    }

    // 4️⃣ (Optional rule) Paid booking cancel policy
    if (bookingRows[0].payment_status === 'paid') {
      // agar chaho to yaha refund logic later add kar sakte ho
      console.log("Paid booking cancelled");
    }

    // 5️⃣ Cancel booking
    await pool.query(
      `UPDATE bookings SET
        booking_status = 'cancelled',
        cancel_reason = ?,
        cancelled_at = NOW()
       WHERE booking_uid = ?`,
      [cancel_reason || "User cancelled", booking_uid]
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    next(error);
  }
});



  
  

module.exports = router;



