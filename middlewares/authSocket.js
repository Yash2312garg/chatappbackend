const jwt = require("jsonwebtoken");

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;
  
  if (!token) {
    console.log("Socket auth failed: No token provided");
    return next(new Error("Authentication error: No token provided"));
  }
  
  try {
    // Destructure only what we need from the decoded token
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach userId directly
    socket.userId = id;
    
    console.log(`Socket authenticated: User ID ${id}`);
    return next();
  } catch (err) {
    console.log(`Socket auth failed: ${err.message}`);
    return next(new Error("Authentication error: Invalid token"));
  }
};

module.exports = { authenticateSocket };