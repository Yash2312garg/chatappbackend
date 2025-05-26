const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSettingsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sound: { type: Boolean, default: true }
    },
    privacy: {
        lastSeenVisibility: { type: String, default: 'everyone' },
        profilePhotoVisibility: { type: String, default: 'everyone' },
        statusVisibility: { type: String, default: 'everyone' }
    },
    theme: { type: String, default: 'dark' },
    fontSize: { type: String, default: 'medium' }
});

module.exports = mongoose.model("UserSettings", UserSettingsSchema);

