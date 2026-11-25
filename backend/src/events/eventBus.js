const EventEmitter = require('events');
const Activity = require('../models/activity.model');
const logger = require('../utils/logger');
const { sendNotificationEmail } = require('../utils/email');

class AppEventEmitter extends EventEmitter {}
const eventBus = new AppEventEmitter();

// Log all events
const logActivity = async (event, actor, ticket, metadata, description) => {
  try {
    await Activity.create({ event, actor, ticket, metadata, description });
    logger.info(`[EVENT] ${event} | Actor: ${actor} | ${description}`);
  } catch (err) {
    logger.error(`[EVENT_LOG_ERROR] ${event}:`, err.message);
  }
};

// ─── Event Handlers ───────────────────────────────────────────────────────────

eventBus.on('TICKET_CREATED', async ({ ticket, actor }) => {
  await logActivity(
    'TICKET_CREATED',
    actor._id || actor,
    ticket._id || ticket,
    { ticketTitle: ticket.title, priority: ticket.priority, category: ticket.category },
    `Ticket "${ticket.title}" was created by ${actor.name || actor}`
  );

  if (actor.email) {
    await sendNotificationEmail({
      to: actor.email,
      subject: `[HelpDesk] Ticket Received: ${ticket.title}`,
      text: `Hi ${actor.name},\n\nYour support ticket "${ticket.title}" (Priority: ${ticket.priority}) has been created and is currently open.`,
    });
  }
});

eventBus.on('TICKET_UPDATED', async ({ ticket, actor, changes }) => {
  await logActivity(
    'TICKET_UPDATED',
    actor._id || actor,
    ticket._id || ticket,
    { changes },
    `Ticket "${ticket.title}" was updated by ${actor.name || actor}`
  );
});

eventBus.on('TICKET_DELETED', async ({ ticketTitle, ticketId, actor }) => {
  await logActivity(
    'TICKET_DELETED',
    actor._id || actor,
    ticketId,
    { ticketTitle },
    `Ticket "${ticketTitle}" was deleted by ${actor.name || actor}`
  );
});

eventBus.on('STATUS_CHANGED', async ({ ticket, actor, oldStatus, newStatus }) => {
  await logActivity(
    'STATUS_CHANGED',
    actor._id || actor,
    ticket._id || ticket,
    { oldStatus, newStatus },
    `Ticket "${ticket.title}" status changed from "${oldStatus}" to "${newStatus}" by ${actor.name || actor}`
  );

  if (ticket.createdBy?.email) {
    await sendNotificationEmail({
      to: ticket.createdBy.email,
      subject: `[HelpDesk] Status Updated: ${ticket.title}`,
      text: `Your ticket "${ticket.title}" status changed from "${oldStatus}" to "${newStatus}".`,
    });
  }

  // Emit TICKET_RESOLVED if status is resolved
  if (newStatus === 'resolved') {
    eventBus.emit('TICKET_RESOLVED', { ticket, actor });
  }
  if (newStatus === 'closed') {
    eventBus.emit('TICKET_CLOSED', { ticket, actor });
  }
});

eventBus.on('PRIORITY_CHANGED', async ({ ticket, actor, oldPriority, newPriority }) => {
  await logActivity(
    'PRIORITY_CHANGED',
    actor._id || actor,
    ticket._id || ticket,
    { oldPriority, newPriority },
    `Ticket "${ticket.title}" priority changed from "${oldPriority}" to "${newPriority}" by ${actor.name || actor}`
  );
});

eventBus.on('COMMENT_ADDED', async ({ comment, ticket, actor }) => {
  await logActivity(
    'COMMENT_ADDED',
    actor._id || actor,
    ticket._id || ticket,
    { commentId: comment._id },
    `Comment added to ticket "${ticket.title}" by ${actor.name || actor}`
  );
});

eventBus.on('COMMENT_UPDATED', async ({ comment, ticket, actor }) => {
  await logActivity(
    'COMMENT_UPDATED',
    actor._id || actor,
    ticket._id || ticket,
    { commentId: comment._id },
    `Comment updated on ticket "${ticket.title}" by ${actor.name || actor}`
  );
});

eventBus.on('COMMENT_DELETED', async ({ commentId, ticket, actor }) => {
  await logActivity(
    'COMMENT_DELETED',
    actor._id || actor,
    ticket._id || ticket,
    { commentId },
    `Comment deleted from ticket "${ticket.title}" by ${actor.name || actor}`
  );
});

eventBus.on('TICKET_RESOLVED', async ({ ticket, actor }) => {
  await logActivity(
    'TICKET_RESOLVED',
    actor._id || actor,
    ticket._id || ticket,
    { resolvedAt: new Date() },
    `Ticket "${ticket.title}" was resolved by ${actor.name || actor}`
  );
  if (ticket.createdBy?.email) {
    await sendNotificationEmail({
      to: ticket.createdBy.email,
      subject: `[HelpDesk] Ticket Resolved: ${ticket.title}`,
      text: `Good news! Your support ticket "${ticket.title}" has been marked as resolved.`,
    });
  }
});

eventBus.on('TICKET_CLOSED', async ({ ticket, actor }) => {
  await logActivity(
    'TICKET_CLOSED',
    actor._id || actor,
    ticket._id || ticket,
    { closedAt: new Date() },
    `Ticket "${ticket.title}" was closed by ${actor.name || actor}`
  );
});

eventBus.on('TICKET_ASSIGNED', async ({ ticket, actor, assignee }) => {
  await logActivity(
    'TICKET_ASSIGNED',
    actor._id || actor,
    ticket._id || ticket,
    { assigneeId: assignee._id || assignee, assigneeName: assignee.name },
    `Ticket "${ticket.title}" was assigned to ${assignee.name || assignee} by ${actor.name || actor}`
  );
});

eventBus.on('USER_REGISTERED', async ({ user }) => {
  await logActivity(
    'USER_REGISTERED',
    user._id,
    null,
    { email: user.email, role: user.role },
    `New user "${user.name}" registered`
  );
});

module.exports = eventBus;
