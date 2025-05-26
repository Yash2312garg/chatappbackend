const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pushNotificationSchema = new Schema({
  // The user who will receive this notification
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // The user who triggered this notification (sender of message, etc.)
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Type of notification for categorization and handling
  type: {
    type: String,
    enum: [
      'new_message',
      'friend_request',
      'request_accepted',
      'message_reaction',
      'mentioned',
      'group_invite',
      'group_activity',
      'system'
    ],
    required: true
  },
  
  // The notification title
  title: {
    type: String,
    required: true
  },
  
  // The notification body/content
  body: {
    type: String,
    required: true
  },
  
  // Additional data payload (JSON format)
  data: {
    // ID of relevant entity (message, request, etc.)
    entityId: Schema.Types.ObjectId,
    
    // Type of entity (e.g., 'message', 'conversation', 'user')
    entityType: String,
    
    // For messages, the conversation ID
    conversationId: Schema.Types.ObjectId,
    
    // Any additional custom fields
    additionalData: Schema.Types.Mixed
  },
  
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  
  // Was notification delivered to device
  delivered: {
    type: Boolean,
    default: false
  },
  
  // When notification should be sent
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  
  // Platform-specific settings
  platform: {
    // FCM/APNs token
    token: String,
    
    // Device type
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
      default: 'web'
    }
  },
  
  // Actual time notification was sent
  sentAt: Date,
  
  // Was notification clicked/opened
  clicked: {
    type: Boolean,
    default: false
  },
  
  // When user clicked the notification
  clickedAt: Date,
  
  // TTL/expiry time for the notification
  expiresAt: Date
  
}, { timestamps: true });

// Indexes for performance
pushNotificationSchema.index({ recipient: 1, read: 1 });
pushNotificationSchema.index({ scheduledFor: 1 });
pushNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Create and export model
const PushNotification = mongoose.model('PushNotification', pushNotificationSchema);

module.exports = PushNotification;
