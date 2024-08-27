const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {
        const products = await Product.find().skip(skip).limit(limit);
        res.json({ products });
    } 
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Error fetching products' });
    }
};

exports.getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Error fetching product details' });
    }
};
