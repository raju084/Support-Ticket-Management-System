const Comment = require('../models/comment.model');
const Ticket = require('../models/ticket.model');
const { createError } = require('../utils/helpers');
const eventBus = require('../events/eventBus');

// POST /api/tickets/:id/comments
const addComment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) return next(createError(403, 'Access denied.'));

    // Only admins can post internal notes
    const isInternal = isAdmin && req.body.isInternal === true;

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      content: req.body.content,
      isInternal,
    });

    await comment.populate('author', 'name email role');
    eventBus.emit('COMMENT_ADDED', { comment, ticket, actor: req.user });

    res.status(201).json({ success: true, message: 'Comment added', data: { comment } });
  } catch (err) {
    next(err);
  }
};

// GET /api/tickets/:id/comments
const getComments = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return next(createError(404, 'Ticket not found.'));

    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return next(createError(403, 'Access denied.'));

    const filter = { ticket: req.params.id };
    if (!isAdmin) filter.isInternal = false; // Users don't see internal notes

    const comments = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .populate('author', 'name email role');

    res.json({ success: true, data: { comments } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tickets/:ticketId/comments/:commentId
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('author', 'name email');
    if (!comment) return next(createError(404, 'Comment not found.'));
    if (comment.ticket.toString() !== req.params.id) return next(createError(400, 'Comment does not belong to this ticket.'));

    const isAuthor = comment.author._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return next(createError(403, 'Access denied.'));

    comment.content = req.body.content;
    comment.editedAt = new Date();
    await comment.save();

    const ticket = await Ticket.findById(req.params.id);
    eventBus.emit('COMMENT_UPDATED', { comment, ticket, actor: req.user });

    res.json({ success: true, message: 'Comment updated', data: { comment } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tickets/:ticketId/comments/:commentId
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return next(createError(404, 'Comment not found.'));
    if (comment.ticket.toString() !== req.params.id) return next(createError(400, 'Comment does not belong to this ticket.'));

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return next(createError(403, 'Access denied.'));

    const ticket = await Ticket.findById(req.params.id);
    const commentId = comment._id;
    await Comment.findByIdAndDelete(req.params.commentId);

    eventBus.emit('COMMENT_DELETED', { commentId, ticket, actor: req.user });

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { addComment, getComments, updateComment, deleteComment };
