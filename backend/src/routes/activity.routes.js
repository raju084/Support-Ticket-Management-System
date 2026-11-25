const express = require('express');
const router = express.Router();
const { getActivities, getTicketActivities } = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getActivities);
router.get('/ticket/:ticketId', getTicketActivities);

module.exports = router;
