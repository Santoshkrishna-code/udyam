class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendSuccess = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true,
    data,
  };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 400, error = null) => {
  const response = {
    success: false,
    message,
  };
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  sendSuccess,
  sendError,
};
