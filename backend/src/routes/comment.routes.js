const express = require('express');
const router = express.Router({ mergeParams: true });
const { addComment, getComments, updateComment, deleteComment } = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { commentValidation } = require('../utils/validators');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.route('/:id/comments').post(commentValidation, validate, addComment).get(getComments);
router.route('/:id/comments/:commentId').put(commentValidation, validate, updateComment).delete(deleteComment);

module.exports = router;
