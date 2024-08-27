const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

function authenticateToken(req, res, next) {
    const token = req.query.token;
    if (!token) return res.redirect('/user');
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send("Forbidden");
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
