const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserDevicesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    devices: [{
        deviceId: String,
        deviceName: String,
        lastActive: Date
    }]
});

module.exports = mongoose.model("UserDevices", UserDevicesSchema);