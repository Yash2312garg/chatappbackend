const { Conversation } = require("../../models/Messaging/conversations");
const { Types } = require("mongoose");

const validateConversation = async (conversationId, userId) => {
  if (!Types.ObjectId.isValid(conversationId)) {
    return { valid: false, error: "Invalid conversation ID" };
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return { valid: false, error: "Conversation not found" };
  }

  const isParticipant = conversation.participants.some(
    participant => participant.toString() === userId
  );

  if (!isParticipant) {
    return { valid: false, error: "User not a participant" };
  }

  return { valid: true, conversation };
};

module.exports = validateConversation;