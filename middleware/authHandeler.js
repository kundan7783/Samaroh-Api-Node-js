require('dotenv').config();
const jwt = require("jsonwebtoken");


async function verifyAuthToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });
    try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = verified;         
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid or Expired Token" });
    }
}


module.exports = verifyAuthToken;