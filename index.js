const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const usersRouter = require("./routes/users");
const ordersRouter = require('./routes/orders');
const productRouter = require('./routes/products');
const cartsRoutser = require('./routes/carts');
var cors = require('cors');
const app = express();

// const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/express-mongoose-demo';
const port = process.env.PORT || 3000;
mongoose.connect('mongodb://localhost:27017/database', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.log('Failed to connect to Mongodb,', err.message));


//app.use(express.json());
    
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());
app.options('*', cors());

app.use('/products', productRouter);
app.use('/orders', ordersRouter);
app.use('/users', usersRouter);
app.use('/carts', cartsRoutser);

app.listen(port, () => console.log(`Server listens on port ${port}`));