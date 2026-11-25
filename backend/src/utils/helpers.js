const jwt = require('jsonwebtoken');

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const generateTokenPair = (userId, role) => {
  const accessToken = generateToken(
    { id: userId, role },
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN || '7d'
  );
  const refreshToken = generateToken(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  );
  return { accessToken, refreshToken };
};

const paginate = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const ALLOWED_TICKET_SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status', 'title', 'category'];

const buildSafeSort = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const field = ALLOWED_TICKET_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  return { [field]: sortOrder === 'asc' ? 1 : -1 };
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  createError,
  generateToken,
  generateTokenPair,
  paginate,
  buildPaginationMeta,
  buildSafeSort,
  escapeRegex,
};
