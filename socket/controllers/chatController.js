const { Message } = require("../../models/Messaging/message");
const { Conversation } = require("../../models/Messaging/conversations");
const validateConversation = require("../utils/validateConversation");

const sendMessage = async (io, socket, { conversationId, content, attachments }) => {
  if (!content && (!attachments || !attachments.length)) {
    return socket.emit("error", { message: "Message cannot be empty" });
  }

  const { valid, error } = await validateConversation(conversationId, socket.userId);
  if (!valid) return socket.emit("error", { message: error });

  const message = await Message.create({
    sender: socket.userId,
    conversation: conversationId, // Add the conversation field
    content,
    attachments: attachments || [],
    createdAt: new Date(),
  });

  await Conversation.findByIdAndUpdate(
    conversationId,
    {
      lastMessage: message._id,
      updatedAt: new Date(),
    },
    { new: true }
  );

  io.to(conversationId).emit("new-message", {
    _id: message._id,
    sender: message.sender,
    content: message.content,
    attachments: message.attachments,
    createdAt: message.createdAt,
    conversationId,
  });
};

const markRead = async (io, socket, { conversationId }) => {
  const result = await Conversation.findOneAndUpdate(
    { _id: conversationId, participants: socket.userId },
    { $set: { "readBy.$[elem].lastRead": new Date() } },
    {
      arrayFilters: [{ "elem.user": socket.userId }],
      new: true,
    }
  );

  io.to(conversationId).emit("message-read", {
    conversationId,
    userId: socket.userId,
    timestamp: new Date(),
  });
};

const typingIndicator = (socket, { conversationId, isTyping }) => {
  socket.to(conversationId).emit("user-typing", {
    conversationId,
    userId: socket.userId,
    isTyping,
  });
};

module.exports = {
  sendMessage,
  markRead,
  typingIndicator,
};
