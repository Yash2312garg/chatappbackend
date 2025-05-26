const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "ASSDGERHqdwkjqbslck";

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization ;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        console.log("No token found in Authorization header");
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // attach decoded user info to request
        next();
    } catch (err) {
        console.log("Token verification failed:", err.message);
        return res.status(401).json({ message: "Token is invalid or expired" });
    }
};

module.exports = { authenticateUser };
