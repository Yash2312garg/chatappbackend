const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true }, // Ensure this is required
    password: { type: String, required: true }, // Ensure password is also required
    profilePicture: { type: String }, // Fixed typo from 'prfilePicture'
    status: { type: String },
    email: { type: String, unique: true },
    mobileNumber: { type: String, unique: true}, // New field for mobile number
    lastSeen: { type: Date },
});

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
