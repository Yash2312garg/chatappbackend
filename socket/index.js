// const {authenticateSocket} = require('')
const { authenticateSocket } = require('../middlewares/authSocket');
const chatHandler = require('./handlers/chatHandler');

module.exports = (io) => {
  io.use(authenticateSocket); // JWT-based authentication

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Attach chat events
    chatHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};
