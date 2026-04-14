import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'bot'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Chat Session'
    },
    description: {
      type: String,
      default: null
    },
    messages: [chatMessageSchema],
    userRole: {
      type: String,
      enum: ['client', 'lawyer', 'paralegal'],
      required: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    tags: [String],
    caseReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Indexes for performance
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, isArchived: 1 });
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

// Method to add a message to session
chatSessionSchema.methods.addMessage = function(role, text) {
  this.messages.push({
    role,
    text,
    timestamp: new Date()
  });
  this.lastMessageAt = new Date();
  this.messageCount = this.messages.length;
};

// Method to get last N messages
chatSessionSchema.methods.getLastMessages = function(n = 5) {
  return this.messages.slice(Math.max(0, this.messages.length - n));
};

// Method to update session title based on first message
chatSessionSchema.methods.updateTitleFromFirstMessage = function() {
  if (this.messages.length > 0 && this.title === 'New Chat Session') {
    const firstMsg = this.messages[0].text;
    this.title = firstMsg.substring(0, 60) + (firstMsg.length > 60 ? '...' : '');
  }
};

// Static method to create new session
chatSessionSchema.statics.createSession = async function(userId, userRole, title = null) {
  const session = new this({
    userId,
    userRole,
    title: title || 'New Chat Session'
  });
  return await session.save();
};

export default mongoose.model('ChatHistory', chatSessionSchema);
