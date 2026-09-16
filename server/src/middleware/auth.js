const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'udyam_super_secret_jwt_key_2026_operations_erp';

    const decoded = jwt.verify(token, secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return sendError(res, 'User not found or account deactivated', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired token', 401);
    }
    return sendError(res, 'Authentication failed', 500);
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user', 401);
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden: requires one of [${allowedRoles.join(', ')}] role`,
        403,
        { currentRole: req.user.role, requiredRoles: allowedRoles }
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
