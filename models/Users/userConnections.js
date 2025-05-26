const mongoose = require('mongoose');
const Schema = mongoose.Schema;




const ConnectionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now }
}, { _id: false })



const UserConnectionsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true ,unique: true},
    contacts: [ConnectionSchema],
    blockedUsers: [ConnectionSchema]
},{
    timestamps: true
});

module.exports = mongoose.model("UserConnections", UserConnectionsSchema);

