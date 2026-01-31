const express = require('express');
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { phoneValidator } = require("../validators/phone_validator");
const { client, service } = require('../twilioConfig');
const myDB = require('../db');
const router = express.Router();


// const NODE_ENV="production";
const REVIEW_PHONE="9117719625";
const OTP = "778306";



function generateTokens(phone_number) {
    const accessToken = jwt.sign(
        {phone_number},
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
        { phone_number },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "60d" }
    );

    return { accessToken, refreshToken };
}


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

        if (phone === REVIEW_PHONE) {
            return res.json({
                message: "OTP bypassed for review account",
                status: "pending"
            });
        }

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


router.post('/verify-otp', async (req, res, next) => {
    try {
        const { phone, otp_code } = req.body;

        if (!phone) return res.json({ message: "Phone is required" });
        if (phone === REVIEW_PHONE) {
            const { accessToken, refreshToken } = generateTokens(phone);

            return res.json({
                message: "Login successful (OTP bypass for review)",
                user_id: null,
                accessToken,
                refreshToken,
                status: "approved"
            });
        }
        if (!otp_code) return res.json({ message: "OTP is required" });


     
        const result = await client.verify.v2
            .services(service)
            .verificationChecks
            .create({ to: `+91${phone}`, code: otp_code });

        if (result.status !== "approved") {
            return res.json({ message: "Invalid OTP", status: result.status });
        }

        const { accessToken, refreshToken } = generateTokens(phone);
        const otpExpireTime = new Date(Date.now() + 5 * 60 * 1000);

        const [authRow] = await myDB.query(
            "SELECT * FROM authentications WHERE phone_number = ?",
            [phone]
        );

        let user_id = null;

        if (authRow.length === 0) {
             await myDB.query(
                `INSERT INTO authentications 
                (phone_number, otp_code, otp_expires_at, expire_token, is_verified) 
                VALUES (?, ?, ?, ?, ?)`,
                [phone, otp_code, otpExpireTime, refreshToken, true]
            );
            user_id = null;
            
        } else {
            user_id = authRow[0].user_id;  

            await myDB.query(
                `UPDATE authentications 
                SET otp_code = ?, otp_expires_at = ?, expire_token = ?, is_verified = ?
                WHERE phone_number = ?`,
                [otp_code, otpExpireTime, refreshToken, true, phone]
            );
        }

        return res.json({
            message: "OTP Verified Successfully",
            user_id: user_id,
            accessToken,
            refreshToken,
            status: result.status
        });

    } catch (error) {
        next(error);
    }
});


router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (error, decoded) => {

            if (error) {
                return res.status(403).json({
                    success: false,
                    message: "Expired or invalid refresh token!"
                });
            }

            
            const phone_number = decoded.phone_number;

            
            const { accessToken, refreshToken } = generateTokens(phone_number);

            return res.status(200).json({
                success: true,
                message: "New access and refresh token generated successfully!",
                accessToken: accessToken,
                refreshToken
            });

        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
