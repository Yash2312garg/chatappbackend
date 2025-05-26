const mongoose = require('mongoose');

const friendsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Reference to the User model
            index: true
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['connected', 'pending', 'blocked'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Friend', friendsSchema);
