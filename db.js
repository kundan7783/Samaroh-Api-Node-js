const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host : "217.21.87.103",
    user : "u205680228_SamarohTeam",
    password : "Samaroh@team328",
    database : "u205680228_samaroh",
    waitForConnections : true, //Jab database me saare connections busy ho jaye, to new request ko wait karne do, error mat do.
    connectionLimit : 10, //Ek time me max 10 database connections allow hain.
    queueLimit : 0, // New requests queue me unlimited wait kar sakti hai.
    connectTimeout: 20000, 
    acquireTimeout: 20000  
});


async function  getCurrentDatabase() {
    try{
        let con=await pool.getConnection();
         console.log("database connection successfully");
         con.release();
    }
    catch(e){
          console.log("database connection failed:"+e);
    }

    
}
getCurrentDatabase();

module.exports = pool;