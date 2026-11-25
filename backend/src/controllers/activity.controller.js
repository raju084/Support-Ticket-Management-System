const Activity = require('../models/activity.model');
const Ticket = require('../models/ticket.model');
const { createError, paginate, buildPaginationMeta } = require('../utils/helpers');

// GET /api/activities  (admin: all; user: own)
const getActivities = async (req, res, next) => {
  try {
    const { page, limit, event, ticketId } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') filter.actor = req.user._id;
    if (event) filter.event = event;
    if (ticketId) filter.ticket = ticketId;

    const { skip, limit: lim, page: pg } = paginate(page, limit);
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('actor', 'name email role')
        .populate('ticket', 'title status'),
      Activity.countDocuments(filter),
    ]);

    res.json({ success: true, data: { activities, pagination: buildPaginationMeta(total, pg, lim) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/activities/ticket/:ticketId
const getTicketActivities = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return next(createError(403, 'Access denied.'));
    }

    const activities = await Activity.find({ ticket: req.params.ticketId })
      .sort({ createdAt: -1 })
      .populate('actor', 'name email role');

    res.json({ success: true, data: { activities } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivities, getTicketActivities };
