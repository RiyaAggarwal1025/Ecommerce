const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

const verifyTokenFromCookies = (req, res, next) => {
    const token = req.query.token || req.body.token || req.params.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const emailId = decoded.EmailId;
    let val = `auth_${emailId}`;
    // console.log(val);
    const cookieToken = req.cookies[val];
    // console.log(cookieToken);
    if (!cookieToken || token !== cookieToken) {
        return res.redirect('/login');
    }
    next();
};

module.exports = verifyTokenFromCookies;