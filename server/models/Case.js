import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema({
  id: {
    type: String
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const hearingDateSchema = new mongoose.Schema({
  id: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  }
});

const noteSchema = new mongoose.Schema({
  id: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const documentSchema = new mongoose.Schema({
  id: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved'],
    default: 'draft'
  },
  url: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  }
});

const taskSchema = new mongoose.Schema({
  id: {
    type: String
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedRole: {
    type: String,
    enum: ['paralegal'],
    required: true,
    default: 'paralegal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const notificationSchema = new mongoose.Schema({
  id: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['assignment', 'document', 'status', 'deadline', 'workflow'],
    default: 'workflow'
  },
  recipientRoles: [{
    type: String,
    enum: ['lawyer', 'paralegal', 'client', 'admin']
  }],
  recipientIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Case title is required']
    },
    category: {
      type: String,
      required: [true, 'Case category is required'],
      enum: [
        'Property Law',
        'Employment Law',
        'Family Law',
        'Criminal Law',
        'Business & Contracts',
        'Corporate Law',
        'Immigration',
        'Intellectual Property'
      ]
    },
    description: {
      type: String,
      required: [true, 'Case description is required']
    },
    status: {
      type: String,
      enum: ['new', 'drafting', 'filed', 'hearing', 'judgment', 'closed'],
      default: 'new'
    },
    statusChangedAt: {
      type: Date,
      default: Date.now
    },
    statusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    caseCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      description: 'The lawyer/paralegal who created the case'
    },
    assignedUsers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['lawyer', 'paralegal']
      },
      assignedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notes: [noteSchema],
    documents: [documentSchema],
    tasks: [taskSchema],
    deadlines: [deadlineSchema],
    hearingDates: [hearingDateSchema],
    suggestedSteps: [String],
    summary: {
      type: String,
      default: null
    },
    caseBase: {
      type: Boolean,
      default: false,
      description: 'Whether this case is published to case base (completed cases)'
    },
    notifications: [notificationSchema]
  },
  { timestamps: true }
);

// Index for faster queries
caseSchema.index({ clientId: 1, status: 1 });
caseSchema.index({ lawyerId: 1, status: 1 });
caseSchema.index({ caseBase: 1 });

export default mongoose.model('Case', caseSchema);
