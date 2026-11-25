const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('avatar').optional().isString().withMessage('Avatar must be a string URL'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const ticketValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category')
    .isIn(['technical', 'billing', 'general', 'feature-request', 'bug', 'account'])
    .withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
];

const updateTicketValidation = [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description too short'),
  body('category')
    .optional()
    .isIn(['technical', 'billing', 'general', 'feature-request', 'bug', 'account'])
    .withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'pending', 'resolved', 'closed'])
    .withMessage('Invalid status'),
];

const commentValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be boolean'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  ticketValidation,
  updateTicketValidation,
  commentValidation,
};
