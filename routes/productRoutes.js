const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const router = express.Router();
const Product = require('../models/product');
const sha256 = require('js-sha256');
const multer = require('multer');
const Cart = require('../models/cart');
const authenticateToken = require('../middleware/authenticateToken');
const checkTokenValidity = require('../middleware/verifyTokenFromCookies');
const JWT_SECRET = 'your-secret-key';

const storage = multer.memoryStorage(); 
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/jpg') {
        cb(null, true);
    } 
    else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 250 * 1024 }
});

const uploadSingle = upload.single('image');

router.get('/', authenticateToken, checkTokenValidity , async (req, res) => {
    try {
        const token = req.query.token;
        const name = req.user.UserID;
        const id = req.user.id;
        const EmailId = sha256(req.user.EmailId);
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const products = await Product.find().skip(skip).limit(limit);
        res.render('index', { products, page, name, id, EmailId, token });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/products', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    try {
        const products = await Product.find().skip(skip).limit(limit);
        res.json({ products });
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    }
    catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/add-to-cart/:id/:id2', async (req, res) => {
    try {
        const userId = req.params.id2;
        const productId = req.params.id;
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, products: [productId] });
        }
        else {
            if (!cart.products.includes(productId)) {
                cart.products.push(productId);
            }
        }
        await cart.save();
        res.json({ success: true, message: 'Product added to cart' });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/viewCart', (req, res) => {
    res.status(200).json({ data: "" });
})

router.get('/view/:Email/:name/:token',checkTokenValidity, async (req, res) => {
    try {
        const { Email, name, token } = req.params;
        const cart = await Cart.findOne({ userId: Email });
        if (!cart) {
            return res.status(404).send('Cart is Empty');
        }
        const products = await Product.find({ _id: { $in: cart.products } });
        let tokens = encodeURIComponent(token);
        res.render('viewCart', { products, name, Email, tokens });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/delete/:Email/:id', async (req, res) => {
    try {
        const { Email, id } = req.params;
        const cart = await Cart.findOne({ userId: Email });
        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        const productIndex = cart.products.indexOf(id);
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the cart' });
        }
        cart.products.splice(productIndex, 1);
        await cart.save();
        res.status(200).json({ message: 'Product removed from cart successfully' });
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/check-stock/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (product) {
            res.json({ available: product.Quantity });
        }
        else {
            res.status(404).json({ error: 'Product not found' });
        }
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/addProduct/:data', async (req,res) => {
    try{
        const token = req.params.data;
        const decoded = jwt.verify(token, JWT_SECRET);
        const userType = decoded.userType;
        // console.log(decoded,userType);
        if (userType === 'Admin') {
            res.json({data: ''});
        } 
        else {
            res.json({ message: 'Not Authorized to access this page' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/add/:token' ,checkTokenValidity,async(req,res) =>{
    let token = req.params.token;
    const products = await Product.find();
    // console.log(products);
    res.render('addProduct', {token : token ,products: products});
})

router.post('/addMyProduct/:token',checkTokenValidity, async (req, res) => {
    uploadSingle(req, res, function (err) {
        if (err) {
            console.error('Multer error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }
        const { productName, price, ram, ssd, quantity } = req.body;
        // console.log(req.file);
        const newProduct = new Product({
            productName: productName,
            price: price,
            Ram: ram,
            SSD: ssd,
            image: req.file ? req.file.originalname : null,
            Quantity: quantity
        });
        // console.log('New Product:', newProduct);
        newProduct.save()
            .then(() => res.json({ success: true, message: 'Product added successfully!' }))
            .catch(error => {
                console.error('Database save error:', error);
                res.status(500).json({ success: false, message: 'Failed to add product', error });
            });
    });
});

router.delete('/deleteProduct/:token/:product' ,checkTokenValidity, async(req,res) => {
    const id = req.params.product;
    try {
        const result = await Product.findByIdAndDelete(id);
        if (!result) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
      } 
      catch (err) {
        res.status(500).json({ message: 'Error deleting product', error: err.message });
      }
})

router.put('/updateProduct/:token/:productId', upload.single('image'), checkTokenValidity, async (req, res) => {
    try {
        const updatedData = {
            productName: req.body.productName,
            Ram: req.body.ram,
            SSD: req.body.ssd,
            price: req.body.price,
            Quantity: req.body.quantity
        };
        if (req.file) {
            updatedData.image = req.file.path;
        }
        const product = await Product.findByIdAndUpdate(req.params.productId, updatedData, { new: true });
        if (product) {
            res.json({ success: true, message: 'Product updated successfully!', product });
        } 
        else {
            res.json({ success: false, message: 'Product not found' });
        }
    } 
    catch (error) {
        res.json({ success: false, message: 'Error updating product: ' + error.message });
    }
});


module.exports = router;