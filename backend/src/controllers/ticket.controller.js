const Ticket = require('../models/ticket.model');
const Comment = require('../models/comment.model');
const { createError, paginate, buildPaginationMeta, buildSafeSort, escapeRegex } = require('../utils/helpers');
const eventBus = require('../events/eventBus');

// POST /api/tickets
const createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority, tags } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      tags: tags || [],
      createdBy: req.user._id,
      statusHistory: [{ status: 'open', changedBy: req.user._id, note: 'Ticket created' }],
    });

    await ticket.populate('createdBy', 'name email');
    eventBus.emit('TICKET_CREATED', { ticket, actor: req.user });

    res.status(201).json({ success: true, message: 'Ticket created successfully', data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets
const getMyTickets = async (req, res, next) => {
  try {
    const { page, limit, status, priority, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const sort = buildSafeSort(sortBy, sortOrder);
    const { skip, limit: lim, page: pg } = paginate(page, limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('commentCount'),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { tickets, pagination: buildPaginationMeta(total, pg, lim) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:id
const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('statusHistory.changedBy', 'name email');

    if (!ticket) return next(createError(404, 'Ticket not found.'));

    // Users can only see their own tickets
    if (req.user.role !== 'admin' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return next(createError(403, 'Access denied.'));
    }

    res.json({ success: true, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tickets/:id
const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    // Only owner or admin
    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return next(createError(403, 'Access denied.'));

    // Users cannot change status/priority (only admins)
    if (!isAdmin && (req.body.status || req.body.priority)) {
      return next(createError(403, 'Only admins can change status or priority.'));
    }

    // Track status and priority changes
    const changes = {};
    const oldStatus = ticket.status;
    const oldPriority = ticket.priority;

    const allowedFields = ['title', 'description', 'category', 'tags'];
    if (isAdmin) allowedFields.push('status', 'priority', 'assignedTo');

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = { from: ticket[field], to: req.body[field] };
        ticket[field] = req.body[field];
      }
    });

    // Track status history
    if (req.body.status && req.body.status !== oldStatus) {
      ticket.statusHistory.push({
        status: req.body.status,
        changedBy: req.user._id,
        note: req.body.statusNote || `Status changed to ${req.body.status}`,
      });
    }

    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    eventBus.emit('TICKET_UPDATED', { ticket, actor: req.user, changes });
    if (req.body.status && req.body.status !== oldStatus) {
      eventBus.emit('STATUS_CHANGED', { ticket, actor: req.user, oldStatus, newStatus: req.body.status });
    }
    if (req.body.priority && req.body.priority !== oldPriority) {
      eventBus.emit('PRIORITY_CHANGED', { ticket, actor: req.user, oldPriority, newPriority: req.body.priority });
    }

    res.json({ success: true, message: 'Ticket updated successfully', data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tickets/:id
const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return next(createError(403, 'Access denied.'));

    // Users can only delete open tickets
    if (req.user.role !== 'admin' && ticket.status !== 'open') {
      return next(createError(400, 'You can only delete tickets with "open" status.'));
    }

    const ticketTitle = ticket.title;
    const ticketId = ticket._id;
    await Promise.all([
      Ticket.findByIdAndDelete(req.params.id),
      Comment.deleteMany({ ticket: ticketId }),
    ]);

    eventBus.emit('TICKET_DELETED', { ticketTitle, ticketId, actor: req.user });

    res.json({ success: true, message: 'Ticket deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/stats (user's own stats)
const getMyStats = async (req, res, next) => {
  try {
    const stats = await Ticket.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Ticket.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ success: true, data: { statusStats: stats, priorityStats } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createTicket, getMyTickets, getTicket, updateTicket, deleteTicket, getMyStats };
