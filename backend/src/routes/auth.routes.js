const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateProfile, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation, updateProfileValidation, changePasswordValidation } = require('../utils/validators');
const { validate } = require('../middleware/validate.middleware');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfileValidation, validate, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, validate, changePassword);

module.exports = router;
