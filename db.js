const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections : true,  //Jab database me saare connections busy ho jaye, to new request ko wait karne do, error mat do.
    connectionLimit : 10,     //Ek time me max 10 database connections allow hain.
    queueLimit : 0,           // New requests queue me unlimited wait kar sakti hai.
    connectTimeout: 20000, 
    acquireTimeout: 20000  
});

async function getCurrentDatabase() {
    try{
       let connect = await pool.getConnection();
       console.log("✅ Database connect successfully..");
       connect.release();
    }catch(err){
        console.log("❌ Database failed : " + err);
    }
}
getCurrentDatabase();

module.exports = pool;
