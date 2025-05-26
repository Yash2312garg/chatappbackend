const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require("../../models/user");

const bcryptSalt = bcrypt.genSaltSync(10)
const login = async (req, res) => {
    const { userName, email, password } = req.body
    if (userName) {
        const foundUser = await User.findOne({ username:userName })
        console.log(userName, email, password )
        console.log(foundUser)
        if (foundUser) {
            const passOk = bcrypt.compareSync(password, foundUser.password)
            if (passOk) {
                const jwtSecret = process.env.JWT_SECRET
                const token = jwt.sign(
                    { userId: foundUser._id, username: foundUser.username }, // Payload
                    jwtSecret, // Secret
                    {} // Options (you can customize if needed)
                );
                res.cookie('token', token, {
                    httpOnly: true,       // Not accessible via JavaScript
                    secure: false,        // In development, since we're using HTTP on localhost
                    sameSite: 'lax',      // Protect against CSRF, works fine for most use cases
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                    path: '/'
                }).status(200).json({
                    id: foundUser._id,
                    username: foundUser.username,
                    email: foundUser.email
                })
            } else {
                res.status(400).json({ message: "Invalid Credentials" })

            }
        } else {
            res.status(400).json({ message: "Invalid Credentials" })
        }
    } else if (email) {
        const foundUser = await User.findOne({ email:email })
        if (foundUser) {
            const passOk = bcrypt.compareSync(password, foundUser.password)
            if (passOk) {
                const jwtSecret = process.env.JWT_SECRET
                const token = jwt.sign(
                    { userId: foundUser._id, username: foundUser.username }, // Payload
                    jwtSecret, // Secret
                    {} // Options (you can customize if needed)
                );
                res.cookie('token', token, {
                    httpOnly: true,       // Not accessible via JavaScript
                    secure: false,        // In development, since we're using HTTP on localhost
                    sameSite: 'lax',      // Protect against CSRF, works fine for most use cases
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                    path: '/'
                }).status(200).json({
                    id: foundUser._id,
                    username: foundUser.username,
                    email: foundUser.email
                })
            } else {
                res.status(400).json({ message: "Invalid Credentials" })
            }
        } else {
            res.status(400).json({ message: "Invalid Credentials" })
        }
    } else {
        res.status(500).json({ message: "Internal Server Error" })
    }
}

module.exports = { login }