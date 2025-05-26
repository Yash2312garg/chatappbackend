const UserSettingsService = require('../../Services/userSettingsServices');

const getSettings = async (req, res) => {
    try {
        const settings = await UserSettingsService.getSettings(req.user.id);
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updated = await UserSettingsService.updateSettings(req.user.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
