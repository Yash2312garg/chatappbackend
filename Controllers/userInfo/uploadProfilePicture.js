const User = require("../../models/Users/user");

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file || !req.file.location) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const imageUrl = req.file.location;
        const userId = req.user.id; // Extracted from token by authenticateUser middleware

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: imageUrl },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            imageUrl
        });
    } catch (err) {
        console.error("Error uploading profile picture:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error while uploading picture"
        });
    }
};

module.exports = { uploadProfilePicture }
