const User = require("../../models/Users/user");
const jwt = require('jsonwebtoken');




const getProfileInfo = async (req, res) => {
    const token = req.cookies?.token;
    const jwtSecret = process.env.JWT_SECRET;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err
            // const {id,username} = userData;
            const user = await User.findOne({ username: userData.username })
            res.json(user)
        })
    } else {
        res.status(401).json('no token')

    }
}

 
module.exports = {getProfileInfo}