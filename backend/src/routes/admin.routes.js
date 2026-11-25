const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const {
  getAllTickets,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/tickets', getAllTickets);
router.patch(
  '/tickets/:id/status',
  [body('status').isIn(['open', 'in-progress', 'pending', 'resolved', 'closed']).withMessage('Invalid status')],
  validate,
  updateTicketStatus
);
router.patch(
  '/tickets/:id/priority',
  [body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')],
  validate,
  updateTicketPriority
);
router.patch('/tickets/:id/assign', assignTicket);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
