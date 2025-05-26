// models/UserBadges.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserBadgesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badges: [String]
});

module.exports = mongoose.model("UserBadges", UserBadgesSchema);