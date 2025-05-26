const UserStatusService = require('../../Services/userStatusService');

const getStatus = async (req, res) => {
    try {
        const status = await UserStatusService.getStatus(req.user.id);
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const updated = await UserStatusService.updateStatus(req.user.id, req.body);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getStatus, updateStatus };
