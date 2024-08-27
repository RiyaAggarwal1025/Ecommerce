const express = require('express');
const router = express.Router();

router.get('/user', async (req,res) => {
    try{
        res.render('user');
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}) 


module.exports = router;