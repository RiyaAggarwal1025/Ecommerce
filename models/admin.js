const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    UserID: { type: String, required: true },
    EmailId: {type: String, required: true, unique: true},
    password: { type: String, required: true }
});

module.exports = mongoose.model('Admin', adminSchema);
