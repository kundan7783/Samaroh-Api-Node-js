const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections : true,  
    connectionLimit : 10,    
    queueLimit : 0,         
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
