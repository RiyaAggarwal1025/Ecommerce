const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');
const nodemailer = require("nodemailer");

const port = 3000;

const JWT_SECRET = 'your-secret-key';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'riyaaggarwal265@gmail.com',
        pass: 'chhaofjqypcnxsxb'
    }
})

exports.signup = async (req, res) => {
    const { UserID, EmailId, password } = req.body;
        // (?=.*[a-z]): Ensures that at least one lowercase letter is present.
        // (?=.*[A-Z]): Ensures that at least one uppercase letter is present.
        // (?=.*\d): Ensures that at least one digit is present.
        // [a-zA-Z\d]{8,}: Ensures the password is at least 8 characters long and contains only letters and digits.
    const passwordRegex =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send("Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, and one number.");
    }
    try {
        const existingUser = await User.findOne({ EmailId });
        if (existingUser) {
            return res.status(400).json({message :"User already exists"});
        }
        const token = jwt.sign({ UserID: UserID , EmailId: EmailId , password : password}, JWT_SECRET, { expiresIn: '24h' });
            const link = `http://localhost:${port}/verify/?token=${encodeURIComponent(token)}`;
            const mailOptions = {
            from: 'riyaaggarwal265@gmail.com',
            to: EmailId,
            subject: 'Verify user',
            text: `Click this link to verify your email Id ${link}`
        };
        transporter.sendMail(mailOptions, (e, i) => {
            if (e) {
                console.log(e);
                return res.status(500).json({ message: 'Email sending failed', error: e });
            } 
            else {
                console.log("Mail sent successfully");
                return res.json({token ,message :"Check Email"});
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

exports.verify = async (req, res) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ message: "Verification token is missing" });
        }
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(400).json({ message: "Invalid or expired token" });
            }
            const { UserID, EmailId, password } = decoded;
            const existingUser = await User.findOne({ EmailId });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }
            const newUser = new User({ UserID, EmailId, password });
            await newUser.save();
            return res.redirect('/login');
        });
    } 
    catch (error) {
        console.error(error);
        return res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    const { UserID, EmailId, password, userType } = req.body;
    try {
        const UserModel = userType === 'Admin' ? Admin : User;
        const user = await UserModel.findOne({ EmailId });
        if (user && user.password === password && user.UserID === UserID) {
            const token = jwt.sign({ id: user._id, UserID: user.UserID, EmailId: user.EmailId ,userType :userType}, JWT_SECRET, { expiresIn: '24h' });
            const cookieName = `auth_${EmailId}`;
            res.cookie(cookieName, token, {
                httpOnly: true,                
                secure: true, 
                maxAge: 24 * 60 * 60 * 1000 
            });
            return res.json({ token });
        } 
        else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
    } 
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

exports.reset = async (req, res) => {
    const { EmailId, password, password2, userType } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send("Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, and one number.");
    }

    try {
        const UserModel = userType === 'Admin' ? Admin : User;
        const user = await UserModel.findOne({ EmailId });

        if (!user) {
            return res.status(404).json({ message: 'The email does not match any account' });
        }

        if (password !== password2) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        await UserModel.updateOne(
            { EmailId: EmailId },
            { $set: { password: password } }
        );

        const mailOptions = {
            from: 'riyaaggarwal265@gmail.com',
            to: EmailId,
            subject: 'Password Modification',
            text: 'Password changed successfully'
        };

        transporter.sendMail(mailOptions, (e, i) => {
            if (e) {
                console.log(e);
                return res.status(500).json({ message: 'Email sending failed', error: e });
            } 
            else {
                console.log("Mail sent successfully");
                return res.json({ message: "Password changed successfully. Check your email for confirmation." });
            }
        });
    } 
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

exports.resetP = async (req, res) => {
    const { EmailId, userType } = req.body;
    const UserModel = userType === 'Admin' ? Admin : User;
    try {
        const user = await UserModel.findOne({ EmailId });
        if (!user) {
            return res.status(404).json({ message: 'The email does not match any account' });
        }
        const token = jwt.sign({EmailId: EmailId, userType: userType}, JWT_SECRET, { expiresIn: '24h' });
        const link = `http://localhost:${port}/reset/?token=${encodeURIComponent(token)}`;
        const mailOptions = {
            from: 'riyaaggarwal265@gmail.com',
            to: EmailId,
            subject: 'Reset Password',
            text: `Click this link to reset password ${link}`
        };
        transporter.sendMail(mailOptions, (e, i) => {
            if (e) {
                console.log(e);
                return res.status(500).json({ message: 'Email sending failed', error: e });
            } 
            else {
                console.log("Mail sent successfully");
                return res.json({ message: " Check your email for confirmation." });
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error });
    }
};

exports.logout = (req, res) => {
    const token = req.params.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    const EmailId = decoded.EmailId;
    const cookieName = `auth_${EmailId}`;
    res.clearCookie(cookieName);
    return res.json({data:""});
};
