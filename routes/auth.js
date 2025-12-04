const express = require('express');
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { phoneValidator } = require("../validators/phone_validator");
const { client, service } = require('../twilioConfig');
const myDB = require('../db');
const router = express.Router();


// =========================
// TOKEN GENERATOR FUNCTION
// =========================
function generateTokens(phone_number) {
    const accessToken = jwt.sign(
        {phone_number},
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "30d" }
    );

    const expireToken = jwt.sign(
        { phone_number },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "60d" }
    );

    return { accessToken, expireToken };
}



// =========================
// SEND OTP
// =========================
router.post('/send-otp', phoneValidator, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const msg = errors.array().map(e => e.msg).join(", ");
        return res.status(400).json({
            success: false,
            message: msg
        });
    }

    try {
        let { phone } = req.body;

        const result = await client.verify.v2
            .services(service)
            .verifications
            .create({ to: `+91${phone}`, channel: "sms" });

        res.json({
            message: "OTP Sent Successfully",
            status: result.status
        });

    } catch (error) {
        next(error);
    }
});




// =========================
// VERIFY OTP
// =========================
router.post('/verify-otp', async (req, res, next) => {
    try {
        const { phone, otp_code } = req.body;

        if (!phone) return res.json({ message: "Phone is required" });
        if (!otp_code) return res.json({ message: "OTP is required" });

     
        const result = await client.verify.v2
            .services(service)
            .verificationChecks
            .create({ to: `+91${phone}`, code: otp_code });

        if (result.status !== "approved") {
            return res.json({ message: "Invalid OTP", status: result.status });
        }

        // Generate JWT Tokens
        const { accessToken, expireToken } = generateTokens(phone);

        // OTP expires after 5 minutes
        const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);

        // Check if user exists
        const [authRow] = await myDB.query(
            "SELECT * FROM authentications WHERE phone_number = ?",
            [phone]
        );

        if (authRow.length === 0) {
            // INSERT
            await myDB.query(
                `INSERT INTO authentications 
                (phone_number, otp_code, otp_expires_at, expire_token, is_verified) 
                VALUES (?, ?, ?, ?, ?)`,
                [phone, otp_code, otpExpireTime, expireToken, true]
            );
        } else {
            // UPDATE
            await myDB.query(
                `UPDATE authentications 
                SET otp_code = ?, otp_expires_at = ?, expire_token = ?, is_verified = ?
                WHERE phone_number = ?`,
                [otp_code, otpExpireTime, expireToken, true, phone]
            );
        }

        return res.json({
            message: "OTP Verified Successfully",
            accessToken,
            expireToken,
            status: result.status
        });

    } catch (error) {
        next(error);
    }
});

router.get('/show/table/all',async(req,res,next)=>{
    try{
        const [wishlist] = await myDB.query('SHOW TABLES');
        res.json(wishlist);
    }catch(error){
        next(error);
    }
});

// =========================
// REFRESH TOKEN
// =========================
router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // VERIFY REFRESH TOKEN
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (error, decoded) => {

            if (error) {
                return res.status(403).json({
                    success: false,
                    message: "Expired or invalid refresh token!"
                });
            }

            // decoded object contains phone_number
            const phone_number = decoded.phone_number;

            // GENERATE NEW TOKENS
            const { accessToken, expireToken } = generateTokens(phone_number);

            return res.status(200).json({
                success: true,
                message: "New access and refresh token generated successfully!",
                accessToken: accessToken,
                refreshToken: expireToken
            });

        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
