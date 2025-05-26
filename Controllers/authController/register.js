const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("../../models/user");


const bcryptSalt = bcrypt.genSaltSync(10)

const register = async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName || !password || !email) {
        return res.status(400).json({ message: 'userName, Email and Password required' })
    }
    try {
        const existingUserviaUserName = await User.findOne({username: userName });
        const existingUserviaUserEmail = await User.findOne({ email:email });
        if (!existingUserviaUserEmail && !existingUserviaUserName) {
            const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
            const createdUser = await User.create({
                username: userName,
                password: hashedPassword,
                email:email
            }); // Ensure this uses the correct field name
    
            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET
    
            // console.log(createdUser._id, jwtSecret)
    
            const token = jwt.sign(
                { userId: createdUser._id, username: createdUser.username,email:createdUser.email}, // Payload
                jwtSecret, // Secret
                {} // Options (you can customize if needed)
            );
    
            // Send the token as a cookie and respond with the user ID
            res.cookie('token', token, {
                httpOnly: true,       // Not accessible via JavaScript
                secure: false,        // In development, since we're using HTTP on localhost
                sameSite: 'lax',      // Protect against CSRF, works fine for most use cases
                maxAge: 24 * 60 * 60 * 1000, // 1 day
                path: '/'
            }) // Ensure the cookie is secure (use 'secure' flag in production)
                .status(200)
                .json({
                    id: createdUser._id,
                    username: createdUser.username,
                    email:createdUser.email
                });
        } else {
            if (existingUserviaUserEmail) {
                res.status(400).json({ message: "User Email already exist" })
            }else{
                res.status(400).json({ message: "User userName already exist" })
            }
        }
    }catch(e){
        console.log(e)
        res.status(500).json({message: "Internal Server Error"})
    }
}


module.exports = {register}