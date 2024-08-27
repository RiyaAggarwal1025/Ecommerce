const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/Database').then(() => console.log('MongoDB connected'))
.catch(err => console.error('Connection error', err));

app.use('/',userRoutes);
app.use('/', authRoutes); 
app.use('/', productRoutes);

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
