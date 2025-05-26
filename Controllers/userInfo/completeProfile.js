const User = require("../../models/Users/user");
const UserStatus = require("../../models/Users/userStatus");

const completeProfile = async (req, res) => {
    try {
        const { customStatus, mobileNumber } = req.body;
        const userId = req.user.id; // pulled from JWT

        const isValidMobile = mobileNumber && mobileNumber.toString().length === 10;
        const isValidStatus = customStatus && customStatus.trim().length > 0;
        let updatedUser;
        let updatedStatus;
        if(!isValidMobile && !isValidStatus){
            return res.status(400).json({
                success: false,
                message: 'Atleast one field is required'
            });
        }
        if (isValidMobile) {
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { mobileNumber },
                { new: true }
            );
        }

        if (isValidStatus) {
            updatedStatus = await UserStatus.findOneAndUpdate(
                { userId },
                { customStatus, status: "Custom" },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser,
            status: updatedStatus
        });

    } catch (error) {
        console.log("Complete Profile Error:", error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while completing profile',
            error: error.message
        });
    }
};

module.exports = { completeProfile };
