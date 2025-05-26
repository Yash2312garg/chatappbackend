const UserStatus = require('../models/Users/userStatus');

const getStatus = async (userId) => {
    const status = await UserStatus.findOne({ userId });
    if (!status) throw new Error("User status not found");
    return status;
};

const updateStatus = async (userId, data) => {
    const updated = await UserStatus.findOneAndUpdate({ userId }, data, { new: true });
    if (!updated) throw new Error("Failed to update user status");
    return updated;
};

module.exports = { getStatus, updateStatus };
