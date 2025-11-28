const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME,
    port : process.env.DB_PORT, 
    waitForConnections : true, //Jab database me saare connections busy ho jaye, to new request ko wait karne do, error mat do.
    connectionLimit : 10, //Ek time me max 10 database connections allow hain.
    queueLimit : 0  // New requests queue me unlimited wait kar sakti hai.
                    // 0 = Unlimited
                    // 50 = max 50 request wait kar sakti hai
                    // 1 = sirf 1 request queue me, baaki error
     
});


module.exports = pool;