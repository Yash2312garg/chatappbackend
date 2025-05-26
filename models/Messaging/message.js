const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // Who sent the message
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // The conversation this message belongs to
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  // Message content
  content: {
    type: String,
    required: function () {
      return this.attachments.length === 0;
    }
  },

  // Attachments (optional)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'audio', 'video'],
    },
    url: String,
    name: String,
    size: Number
  }],

  // Whether the message has been deleted (soft delete)
  deleted: {
    type: Boolean,
    default: false
  },

  // Type of message
  messageType: {
    type: String,
    enum: ['text', 'system', 'announcement'],
    default: 'text'
  }
}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: -1 });


const Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message,
};