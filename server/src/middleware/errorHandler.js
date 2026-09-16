const { sendError, AppError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('⚠️ [Error Handler]:', err.message || err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? err.meta.target : 'field';
    return sendError(
      res,
      `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists`,
      409,
      { code: err.code, meta: err.meta }
    );
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(
      res,
      err.meta?.cause || 'Requested record not found',
      404,
      { code: err.code }
    );
  }

  // Generic syntax or JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Malformed JSON payload in request body', 400);
  }

  // Fallback 500
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal Server Error',
    500
  );
};

module.exports = errorHandler;
