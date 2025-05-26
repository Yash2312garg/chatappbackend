const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserStatusSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'Available' },
    customStatus: { type: String },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
});

module.exports = mongoose.model("UserStatus", UserStatusSchema);
