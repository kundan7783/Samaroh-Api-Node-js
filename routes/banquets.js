const express = require("express");
const upload = require('../controllers/image_upload_controller');
const pool = require("../db");
const router = express.Router();

router.post("/", upload.array("imagesString", 25), async (req, res, next) => {
    try {
        const {
            feature_id,
            availability_status_id,
            booking_status_id,
            banquet_name,
            banquet_address,
            contact_number,
            banquet_map_link,
            description,
            district,
            min_capacity,
            max_capacity,
            number_of_rooms,
            veg_price,
            nonveg_price,

        } = req.body;

        // ⭐ MULTER se file names
        const imageFiles = req.files.map(file => file.filename);

        // ⭐ array → comma separated string
        const imagesString = imageFiles.join(",");

        const [result] = await pool.query(
            `INSERT INTO banquets (
                feature_id,
                availability_status_id,
                booking_status_id,
                banquet_name,
                banquet_address,
                contact_number,
                banquet_map_link,
                description,
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
                availability_status_id,
                booking_status_id,
                banquet_name,
                banquet_address,
                contact_number,
                banquet_map_link,
                description,
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



///////////////////////////
router.get("/", async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                    banquets.banquet_name,
                    banquets.banquet_address,
                    banquets.contact_number,
                    banquets.banquet_map_link,
                    banquets.description,
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
                    banquet_features.fire_sefty,

                    booking_status.status_name AS booking_status,
                    availability_status.status_name AS availability_status

                FROM banquets 
                LEFT JOIN banquet_features 
                    ON banquets.feature_id = banquet_features.id
                LEFT JOIN availability_status  
                    ON banquets.availability_status_id = availability_status.id
                LEFT JOIN booking_status 
                    ON banquets.booking_status_id = booking_status.id;

        `);

        // ⭐ Images array me convert karna
        const banquets = rows.map(b => {
            if(b.images) {
                b.images = b.images.split(",");
            }
            return b;
        });


        res.json(banquets);

    } catch (err) {
        next(err)
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                banquets.banquet_name,
                banquets.banquet_address,
                banquets.contact_number,
                banquets.banquet_map_link,
                banquets.description,
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
                banquet_features.fire_sefty,

                booking_status.status_name AS booking_status,
                availability_status.status_name AS availability_status

            FROM banquets 
            LEFT JOIN banquet_features 
                ON banquets.feature_id = banquet_features.id
            LEFT JOIN availability_status  
                ON banquets.availability_status_id = availability_status.id
            LEFT JOIN booking_status 
                ON banquets.booking_status_id = booking_status.id
            WHERE banquets.id = ?
        `, [id]);

        if(rows.length === 0) {
            return res.status(404).json({ success: false, message: "Banquet not found" });
        }

        // ⭐ Images array me convert karna
        const banquets = rows.map(b => {
            if(b.images) {
                b.images = b.images.split(",");
            }
            return b;
        });
        res.json(banquets[0]);

    } catch (err) {
        next(err);
    }
});


// GET banquets by district
router.get("/district/:district", async (req, res, next) => {
    try {
        const { district } = req.params;

        const [rows] = await pool.query(`
            SELECT 
                banquets.id,
                banquets.banquet_name,
                banquets.banquet_address,
                banquets.contact_number,
                banquets.banquet_map_link,
                banquets.description,
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
                banquet_features.fire_sefty,

                booking_status.status_name AS booking_status,
                availability_status.status_name AS availability_status

            FROM banquets 
            LEFT JOIN banquet_features 
                ON banquets.feature_id = banquet_features.id
            LEFT JOIN availability_status  
                ON banquets.availability_status_id = availability_status.id
            LEFT JOIN booking_status 
                ON banquets.booking_status_id = booking_status.id
            WHERE banquets.district = ?
        `, [district]);

        if(rows.length === 0) {
            return res.status(404).json({ success: false, message: `No banquets found in ${district}` });
        }

        // ⭐ Images array me convert karna
        const banquets = rows.map(b => {
            if(b.images) {
                b.images = b.images.split(",");
            }
            return b;
        });

        res.json(banquets);

    } catch (err) {
        next(err);
    }
});

// Get Popular banquets

router.get('/popular', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                banquets.banquet_name,
                banquets.banquet_address,
                banquets.contact_number,
                banquets.banquet_map_link,
                banquets.description,
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
                banquet_features.fire_sefty,

                booking_status.status_name AS booking_status,
                availability_status.status_name AS availability_status

            FROM banquets 
            LEFT JOIN banquet_features 
                ON banquets.feature_id = banquet_features.id
            LEFT JOIN availability_status  
                ON banquets.availability_status_id = availability_status.id
            LEFT JOIN booking_status 
                ON banquets.booking_status_id = booking_status.id

            ORDER BY banquets.nonveg_price DESC
            LIMIT 10;
        `);

        // ⭐ Images Split
        const popular = rows.map(b => {
            if (b.images) {
                b.images = b.images.split(",");
            }
            return b;
        });

        res.json(popular);

    } catch (error) {
        next(error);
    }
});









module.exports = router;
