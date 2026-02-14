const jwt = require("jsonwebtoken");


async function verifyAuthToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Access token missing"
        });
    }
    try {
        const verified = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = verified;         
        next();
    } catch (error) {
         return res.status(401).json({
            message: "Access token expired or invalid"
        });
       
    }
}


module.exports = verifyAuthToken;