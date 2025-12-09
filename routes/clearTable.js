const express = require("express");
const router = express.Router();
const pool = require("../db");

router.delete('/delete-user/user-table',async(req,res,next)=>{
    try{

        

         await pool.query(`TRUNCATE TABLE users`);

        return res.json({ success: true, message: "Clear table user successfully" });

    }catch(error){
       next(error);
    }
});

router.delete('/delete-auth/auth-table',async(req,res,next)=>{
    try{


         await pool.query(`TRUNCATE TABLE authentications`);

        return res.json({ success: true, message: "Clear table authentications successfully" });

    }catch(error){
        next(error);
    }
});

module.exports = router;