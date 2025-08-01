export function errorHandler(err, req, res, next) {
  // Log error details (sanitized to avoid PII)
  const logError = {
    message: err.message,
    name: err.name,
    status: err.status,
    path: req.path, // Use path instead of full URL to avoid query params
    method: req.method,
    // Remove IP and user agent for privacy compliance
    timestamp: new Date().toISOString(),
  };

  // Only log stack trace in development
  if (process.env.NODE_ENV === 'development') {
    logError.stack = err.stack;
  }

  console.error('Server Error:', logError);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.name === 'MongoError' && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({
      error: 'Resource already exists',
      field: field,
    });
  }

  // Handle MongoDB cast errors (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid resource ID format',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication token expired',
    });
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
    });
  }

  // Default error response
  const statusCode = err.status || 500;
  const isServerError = statusCode >= 500;

  // In production, don't expose internal error details
  const response = {
    error:
      isServerError && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'An error occurred',
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
