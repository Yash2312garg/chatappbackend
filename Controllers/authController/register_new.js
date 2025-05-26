const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("../../models/Users/user");
const UserSettings = require("../../models/Users/userSettings");
const UserStatus = require("../../models/Users/userStatus");

const JWT_SECRET = process.env.JWT_SECRET || "ASSDGERHqdwkjqbslck"
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "24h";
// const bcryptSalt = bcrypt.genSaltSync(10)


/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
const register = async (req, res) => {
    try {
        const { username, fullName, password, email, mobileNumber } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            })
        }

        const bcryptSalt = bcrypt.genSaltSync(10)
        const hashed_password = await bcrypt.hash(password, bcryptSalt)
        const new_user = new User({
            username,
            fullName,
            password: hashed_password,
            email,
            mobileNumber: mobileNumber || ''
        })
        const savedUser = await new_user.save();
        const token = jwt.sign(
            { id: savedUser._id, username: savedUser.username },
            JWT_SECRET,

            { expiresIn: JWT_EXPIRATION }
        );
        console.log(savedUser,res.user)
        await UserSettings.create({ userId: savedUser._id });
        await UserStatus.create({ userId: savedUser._id });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                fullName: savedUser.fullName,
                email: savedUser.email,
                profilePicture: savedUser.profilePicture,
                isEmailVerified: savedUser.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }

}


module.exports = { register }