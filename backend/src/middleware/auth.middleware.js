const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { createError } = require('../utils/helpers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Access denied. No token provided.'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(createError(401, 'User not found or token invalid.'));
    if (!user.isActive) return next(createError(403, 'Account is deactivated.'));

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(createError(401, 'Token expired.'));
    if (err.name === 'JsonWebTokenError') return next(createError(401, 'Invalid token.'));
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, `Role "${req.user.role}" is not authorized for this action.`));
    }
    next();
  };
};

module.exports = { authenticate, authorize };
