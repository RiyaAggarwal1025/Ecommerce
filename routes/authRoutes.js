const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'

router.get('/signup', (req, res) => res.render('signup'));

router.post('/signup', authController.signup);

router.get('/verify', authController.verify);

router.get('/login', (req, res) => {
    const userType = req.query.userType;
    if (userType === 'Admin') {
        return res.render('login', { userType: 'Admin' });
    }
    return res.render('login', { userType: 'Buyer' });
});

router.post('/login', authController.login);

router.get('/logout/:token',authController.logout);

router.get('/resetP',(req,res) => {
    const userType = req.query.userType;
    if (userType === 'Admin') {
        return res.render('resetP', { userType: 'Admin' });
    }
    return res.render('resetP', { userType: 'Buyer' });
});

router.post('/resetP', authController.resetP);

router.get('/reset', (req, res) => {
    const token = req.query.token;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { EmailId, userType } = decoded;
        res.render('reset', { EmailId, userType }); 
      } 
    catch (err) {
        return res.status(400).send('Invalid or expired token');
    }
});

router.post('/reset' , authController.reset);

module.exports = router;
