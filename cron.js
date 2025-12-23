// cron.js
const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const SYSTEM_KEY = process.env.SYSTEM_SECRET_KEY;
const BASE_URL = 'https://samaroh-api-node-js.onrender.com/api/booking'; // agar live, to live URL

// 🔹 Har 10 minute me run
cron.schedule('*/10 * * * *', async () => {
    try {
        console.log("Running system jobs...");

        // 1️⃣ Auto cancel unpaid
        await axios.post(`${BASE_URL}/auto-cancel-unpaid`, {}, {
            headers: { 'x-system-key': SYSTEM_KEY }
        });

        // 2️⃣ Auto confirm
        await axios.post(`${BASE_URL}/auto-confirm`, {}, {
            headers: { 'x-system-key': SYSTEM_KEY }
        });

        console.log("System jobs completed successfully.");
    } catch (err) {
        console.error("System job error:", err.message);
    }
});
