const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['technical', 'billing', 'general', 'feature-request', 'bug', 'account'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: [{ type: String, trim: true }],
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    statusHistory: [
      {
        status: { type: String, enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'] },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: comment count
ticketSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'ticket',
  count: true,
});

// Indexes for performance
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ title: 'text', description: 'text' });
ticketSchema.index({ createdAt: -1 });

// Pre-save: track status changes and set timestamps
ticketSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
