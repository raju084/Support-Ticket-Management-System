const Ticket = require('../models/ticket.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const Activity = require('../models/activity.model');
const { createError, paginate, buildPaginationMeta, buildSafeSort, escapeRegex } = require('../utils/helpers');
const eventBus = require('../events/eventBus');

// GET /api/admin/tickets
const getAllTickets = async (req, res, next) => {
  try {
    const {
      page, limit, status, priority, category,
      search, assignedTo, sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
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

// PATCH /api/admin/tickets/:id/status
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
      note: note || `Status changed to ${status}`,
    });

    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    eventBus.emit('STATUS_CHANGED', { ticket, actor: req.user, oldStatus, newStatus: status });

    res.json({ success: true, message: `Ticket status updated to "${status}"`, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/tickets/:id/priority
const updateTicketPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const oldPriority = ticket.priority;
    ticket.priority = priority;
    await ticket.save();

    eventBus.emit('PRIORITY_CHANGED', { ticket, actor: req.user, oldPriority, newPriority: priority });

    res.json({ success: true, message: `Priority updated to "${priority}"`, data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/tickets/:id/assign
const assignTicket = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    let assignee = null;
    if (assignedTo) {
      assignee = await User.findById(assignedTo);
      if (!assignee) return next(createError(404, 'Assignee not found.'));
    }

    ticket.assignedTo = assignedTo || null;
    await ticket.save();

    if (assignee) {
      eventBus.emit('TICKET_ASSIGNED', { ticket, actor: req.user, assignee });
    }

    res.json({ success: true, message: 'Ticket assigned successfully', data: { ticket } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      totalUsers,
      criticalTickets,
      recentTickets,
      ticketsByCategory,
      ticketsByPriority,
      ticketsOverTime,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in-progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
      User.countDocuments({ role: 'user' }),
      Ticket.countDocuments({ priority: 'critical', status: { $nin: ['resolved', 'closed'] } }),
      Ticket.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name email'),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
          totalUsers,
          criticalTickets,
          pendingTickets: totalTickets - resolvedTickets - closedTickets,
        },
        recentTickets,
        ticketsByCategory,
        ticketsByPriority,
        ticketsOverTime: ticketsOverTime.reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limit: lim, page: pg } = paginate(page, limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, pagination: buildPaginationMeta(total, pg, lim) } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(createError(400, 'You cannot deactivate your own account.'));
    }
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found.'));

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTickets,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
};
