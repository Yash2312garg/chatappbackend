const jwt = require('jsonwebtoken');

function verifyToken(token, callback) {
    const jwtSecret = process.env.JWT_SECRET;
    jwt.verify(token, jwtSecret, {}, callback);
}


module.exports = {
    verifyToken,
};
