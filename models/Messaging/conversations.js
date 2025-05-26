const mongoose = require('mongoose');
const schema = mongoose.Schema;

const conversationSchema = new schema({
    // Users in the conversation
    participants: [{
      type: schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
  
    // Last message sent in this conversation
    lastMessage: {
      type: schema.Types.ObjectId,
      ref: 'Message'
    },
  
    // Optional: group name (for group chats)
    name: {
      type: String,
      default: ''
    },
  
    // Is this a group conversation?
    isGroupChat: {
      type: Boolean,
      default: false
    },
  
    // Users who muted this conversation
    mutedBy: [{
      user: {
        type: schema.Types.ObjectId,
        ref: 'User'
      },
      until: {
        type: Date,
        default: null
      }
    }],
  
    // Who read the conversation and when
    readBy: [{
      user: {
        type: schema.Types.ObjectId,
        ref: 'User'
      },
      lastRead: {
        type: Date,
        default: Date.now
      }
    }]
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  conversationSchema.index({ participants: 1 });
  conversationSchema.index({ updatedAt: -1 });
  
  // Virtual field (optional) — for populating unread count dynamically
  conversationSchema.virtual('unreadCount').get(function () {
    return this._unreadCount || 0;
  });
  

  const Conversation = mongoose.model('Conversation', conversationSchema);
  
  module.exports = {
    Conversation
  };