import mongoose from 'mongoose';

const caseHistorySchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true
    },
    action: {
      type: String,
      enum: [
        'created',
        'status_changed',
        'document_added',
        'document_removed',
        'hearing_scheduled',
        'note_added',
        'deadline_set',
        'assigned_user',
        'removed_user',
        'closed'
      ],
      required: true
    },
    previousStatus: {
      type: String,
      default: null
    },
    newStatus: {
      type: String,
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    details: {
      type: String,
      default: null
    },
    metadata: {
      type: Object,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for faster queries
caseHistorySchema.index({ caseId: 1, timestamp: -1 });
caseHistorySchema.index({ performedBy: 1 });
caseHistorySchema.index({ action: 1 });

export default mongoose.model('CaseHistory', caseHistorySchema);
