const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        'TICKET_CREATED',
        'TICKET_UPDATED',
        'TICKET_DELETED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'COMMENT_ADDED',
        'COMMENT_UPDATED',
        'COMMENT_DELETED',
        'TICKET_RESOLVED',
        'TICKET_CLOSED',
        'TICKET_ASSIGNED',
        'USER_REGISTERED',
        'USER_LOGGED_IN',
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ ticket: 1, createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ event: 1 });

module.exports = mongoose.model('Activity', activitySchema);
