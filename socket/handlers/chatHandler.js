const { Types } = require("mongoose");
const {
  sendMessage,
  markRead,
  typingIndicator,
} = require("../controllers/chatController");

const isDev = process.env.NODE_ENV !== "production";


const chatHandler = (io, socket) => {
  if (isDev) {
    const originalOn = socket.on;
    socket.on = (event, handler) => {
      return originalOn.call(socket, event, (...args) => {
        console.log(`[DEV] Event: ${event} | Data:`, args[0]);
        return handler(...args);
      });
    };
  }

  socket.on("join-conversations", (conversationIds) => {
    if (!Array.isArray(conversationIds)) {
      return socket.emit("error", { message: "Conversation IDs must be an array" });
    }

    const validIds = conversationIds.filter(id => Types.ObjectId.isValid(id));
    validIds.forEach(id => socket.join(id));

    socket.emit("conversations-joined", {
      success: true,
      joined: validIds.length,
    });
  });

  socket.on("send-message", (data) => sendMessage(io, socket, data));

  socket.on("mark-read", (data) => markRead(io, socket, data));

  socket.on("typing", (data) => typingIndicator(socket, data));

  // socket.on("disconnect", () => {
  //   if (isDev) {
  //     console.log(`User ${socket.userId} disconnected`);
  //   }
  // });
};

module.exports = chatHandler;