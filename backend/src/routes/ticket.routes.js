const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getTicket, updateTicket, deleteTicket, getMyStats } = require('../controllers/ticket.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ticketValidation, updateTicketValidation } = require('../utils/validators');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/stats/me', getMyStats);
router.route('/').post(ticketValidation, validate, createTicket).get(getMyTickets);
router.route('/:id').get(getTicket).put(updateTicketValidation, validate, updateTicket).delete(deleteTicket);

module.exports = router;
