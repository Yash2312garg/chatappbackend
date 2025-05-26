const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userSchema = new schema({
    username: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    profilePicture: { type: String, default: '' },
    mobileNumber: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    accountCreatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });


module.exports = mongoose.model("User",userSchema);

