const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    Ram: String,
    SSD: String,
    price: { type: String, required: true },
    image: { type: String, required: true },
    Quantity: {type : String} 
});

module.exports = mongoose.model('Product', productSchema);
