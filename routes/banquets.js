const express = require("express");
const upload = require('../controllers/image_upload_controller');
const pool = require("../db");
const router = express.Router();

router.post("/", upload.array("imagesString", 25), async (req, res, next) => {
    try {
        const {
            feature_id,
            banquet_name,
            banquet_address,
            contact_number,
            banquet_map_link,
            description,
            latitude,
            longitude,
            district,
            min_capacity,
            max_capacity,
            number_of_rooms,
            veg_price,
            nonveg_price,

        } = req.body;

      
        const imageFiles = req.files.map(file => file.filename);

   
        const imagesString = imageFiles.join(",");

        const [result] = await pool.query(
            `INSERT INTO banquets (
                feature_id,
                banquet_name,
                banquet_address,
                contact_number,
                banquet_map_link,
                description,
                latitude,
                longitude,
                district,
                min_capacity,
                max_capacity,
                number_of_rooms,
                veg_price,
                nonveg_price,
                images
              
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ,
            [
                feature_id,
                banquet_name,
                banquet_address,
                contact_number,
                banquet_map_link,
                description,
                latitude,
                longitude,
                district,
                min_capacity,
                max_capacity,
                number_of_rooms,
                veg_price,
                nonveg_price,
                imagesString
            ]
        );

        res.json({
            success: true,
            message: "Banquet Created Successfully",
            banquetId: result.insertId,
            images_saved: imageFiles
        });

    } catch (error) {
        next(error)
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                banquets.id,
                banquets.banquet_name,
                banquets.banquet_address,
                banquets.contact_number,
                banquets.banquet_map_link,
                banquets.description,
                banquets.latitude,
                banquets.longitude,
                banquets.district,
                banquets.min_capacity,
                banquets.max_capacity,
                banquets.number_of_rooms,
                banquets.veg_price,
                banquets.nonveg_price,
                banquets.images,
                banquet_features.ac, 
                banquet_features.wifi, 
                banquet_features.cctv, 
                banquet_features.sound_system, 
                banquet_features.parking, 
                banquet_features.fire_sefty

            FROM banquets 
            LEFT JOIN banquet_features 
                ON banquets.feature_id = banquet_features.id
            WHERE banquets.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Banquet not found" });
        }

       
        const banquets = rows.map(b => {
            if (b.images) {
                const imgArray = b.images.split(",");
                b.images = imgArray.slice(1, 6);
            }
            return b;
        });



        res.json(banquets[0]);

    } catch (err) {
        next(err);
    }
});



router.get("/district/:district", async (req, res, next) => {
    try {
        const { district } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                id,
                banquet_name,
                banquet_address,
                min_capacity,
                max_capacity,
                veg_price,
                district,
                nonveg_price,
                images
            FROM banquets 
            WHERE banquets.district = ?
        `, [district]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `No banquets found in ${district}` });
        }
        const banquets = rows.map(b => {
           if (b.images) {
               const imgArray = b.images.split(",");
               b.images = imgArray.slice(0, 1);
           }
           return b;
       });
        res.json(banquets);

    } catch (err) {
        next(err);
    }
});



router.get('/popular/place', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                banquet_name,
                banquet_address,
                min_capacity,
                max_capacity,
                veg_price,
                district,
                nonveg_price,
                images
            FROM banquets 
            ORDER BY nonveg_price DESC
            LIMIT 10;
        `);

         const banquets = rows.map(b => {
            if (b.images) {
                const imgArray = b.images.split(",");
                b.images = imgArray.slice(0, 1);
            }
            return b;
        });


        res.json(banquets);

    } catch (error) {
        next(error);
    }
});


router.get("/all-images/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            "SELECT images FROM banquets WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Banquet not found" });
        }

        let imagesArray = [];

        if (rows[0].images) {
            imagesArray = rows[0].images.split(",");
        }

        res.json({
            success: true,
            images: imagesArray
        });

    } catch (err) {
        next(err);
    }
});










module.exports = router;
