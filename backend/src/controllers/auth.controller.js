const User = require('../models/user.model');
const { generateTokenPair, createError } = require('../utils/helpers');
const eventBus = require('../events/eventBus');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(createError(409, 'Email already registered.'));

    // Public registration always assigns 'user' role to prevent privilege escalation
    const user = await User.create({ name, email, password, role: 'user' });
    const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    eventBus.emit('USER_REGISTERED', { user });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) return next(createError(401, 'Invalid email or password.'));
    if (!user.isActive) return next(createError(403, 'Account is deactivated. Contact support.'));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(createError(401, 'Invalid email or password.'));

    const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, lastLogin: user.lastLogin },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(createError(400, 'Refresh token required.'));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return next(createError(401, 'Invalid refresh token.'));
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id, user.role);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(createError(401, 'Refresh token expired. Please login again.'));
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('ticketCount');
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/me
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(createError(400, 'Current password is incorrect.'));

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updateProfile, changePassword };
