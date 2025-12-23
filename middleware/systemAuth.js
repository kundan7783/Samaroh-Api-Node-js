// middleware/systemAuth.js
require('dotenv').config();

function verifySystemKey(req, res, next) {
    const systemKey = req.headers['x-system-key']; // headers se system key lo
    if (!systemKey || systemKey !== process.env.SYSTEM_SECRET_KEY) {
        return res.status(401).json({ success: false, message: "Unauthorized system call" });
    }
    next();
}

module.exports = verifySystemKey;
