const User = require("../../models/Users/user")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SCECRET = process.env.JWT_SECRET || "ASSDGERHqdwkjqbslck"
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";

/**
* @route  POST /auth/login
* @desc login
* @access public

*/

const login = async (req, res) => {

    try {
        const { login, password } = req.body
        const user = await User.findOne({
            $or: [{ email: login }, { username: login }]
        })
        if (!user) {
            return res.status(404).json(
                {
                    success: false,
                    message: "User not Found"
                })
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
            },
            JWT_SCECRET,
            { expiresIn: JWT_EXPIRATION }
        )

        return res.status(200).json({
            success: true,
            message: "Logged in Successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullName,
                email: user.email,
                profilePicture: user.profilePicture,
                isEmailVerified: user.isEmailVerified

            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
}


module.exports = { login }