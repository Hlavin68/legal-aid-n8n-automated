import mongoose from 'mongoose';

const caseBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Property Law',
        'Employment Law',
        'Family Law',
        'Criminal Law',
        'Business & Contracts',
        'Corporate Law',
        'Immigration',
        'Intellectual Property',
        'Constitutional Law',
        'Environmental Law',
        'Tax Law',
        'Other'
      ]
    },
    brief: {
      type: String,
      required: [true, 'Brief summary is required'],
      trim: true,
      maxlength: 500
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    pdfUrl: {
      type: String,
      required: [true, 'PDF file is required']
    },
    keywords: {
      type: [String],
      default: []
    },
    court: {
      type: String,
      trim: true,
      default: ''
    },
    judge: {
      type: String,
      trim: true,
      default: ''
    },
    citation: {
      type: String,
      trim: true,
      default: ''
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: new Date().getFullYear()
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for search functionality
caseBaseSchema.index({ title: 'text', description: 'text', keywords: 'text' });
caseBaseSchema.index({ category: 1, isPublished: 1 });
caseBaseSchema.index({ createdAt: -1 });

// Virtual for case URL
caseBaseSchema.virtual('caseUrl').get(function() {
  const normalizedPath = this.pdfUrl?.startsWith('/')
    ? this.pdfUrl
    : `/${this.pdfUrl}`;
  return `http://localhost:5000${normalizedPath}`;
});

// Ensure virtuals are included in JSON
caseBaseSchema.set('toJSON', { virtuals: true });

export default mongoose.model('CaseBase', caseBaseSchema);
