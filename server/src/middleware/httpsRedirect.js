// Middleware to enforce HTTPS in production
export function enforceHTTPS(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Validate host header to prevent host header injection attacks
  const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') || [];
  const host = req.headers.host;

  if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
    return res.status(400).json({ error: 'Invalid host header' });
  }

  // Check if request is already secure
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    req.connection.encrypted;

  if (!isSecure) {
    const httpsUrl = `https://${host}${req.url}`;
    return res.redirect(301, httpsUrl);
  }

  // Add HSTS header for HTTPS responses
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );
  next();
}

// Trust proxy headers (needed for services like Heroku, Railway, etc.)
export function trustProxy(app) {
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
}
