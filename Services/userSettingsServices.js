const UserSettings = require('../models/Users/userSettings');

const getSettings = async (userId) => {
    const settings = await UserSettings.findOne({ userId });
    if (!settings) throw new Error("User settings not found");
    return settings;
};

const updateSettings = async (userId, data) => {
    const updated = await UserSettings.findOneAndUpdate({ userId }, data, { new: true });
    if (!updated) throw new Error("Failed to update user settings");
    return updated;
};

module.exports = { getSettings, updateSettings };
