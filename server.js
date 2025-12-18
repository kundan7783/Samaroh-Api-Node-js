require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRouters = require('./routes/auth');
const userRouters = require('./routes/user');
const banquetRouters = require('./routes/banquets');
const ratingRouters = require('./routes/ratings');
const wishlistRouters = require('./routes/wishlist');
const clearTableRouters = require('./routes/clearTable');
const bookingRouters = require('./routes/bookings');
const createTableRouters = require('./routes/createTable');
const paymentRouters = require('./routes/payment');
const errorHandler = require('./middleware/errorHandler');


const app = express();
app.use(bodyParser.json());
app.use("/uploades_images",express.static("uploades_images"));

app.get('/', (req, res) => res.json({ message: 'Banquet API running' }));


app.use('/api/auth',authRouters);
app.use('/api/user',userRouters);
app.use('/api/banquet',banquetRouters);
app.use('/api/rating',ratingRouters);
app.use('/api/wishlist',wishlistRouters);
app.use('/api/clear-table',clearTableRouters);
app.use('/api/booking',bookingRouters);
app.use('/api/createTable',createTableRouters);
 app.use('/api/payment',paymentRouters);



app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`Serever running on port ${PORT}`));
