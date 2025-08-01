// Simple HTML escape function to prevent XSS
function sanitizeString(input, maxLength) {
  if (typeof input !== 'string') return input;

  // Simple HTML escape - no need for heavy DOMPurify
  const sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();

  // Limit length
  return sanitized.substring(0, maxLength);
}

// Middleware to sanitize request data
export function sanitizeInput(options = {}) {
  return (req, res, next) => {
    try {
      // Only sanitize specific fields we know about - don't modify object structure
      if (req.body) {
        if (req.body.username) {
          req.body.username = sanitizeString(req.body.username, 20);
        }
        if (req.body.email) {
          req.body.email = sanitizeString(req.body.email, 254);
        }
        if (req.body.password) {
          // Don't sanitize passwords - just limit length for security
          if (
            typeof req.body.password === 'string' &&
            req.body.password.length > 100
          ) {
            req.body.password = req.body.password.substring(0, 100);
          }
        }
        if (req.body.message) {
          req.body.message = sanitizeString(req.body.message, 500);
        }
        if (req.body.chatMessage) {
          req.body.chatMessage = sanitizeString(req.body.chatMessage, 500);
        }
        if (req.body.playerName) {
          req.body.playerName = sanitizeString(req.body.playerName, 50);
        }
        if (req.body.gameAction) {
          req.body.gameAction = sanitizeString(req.body.gameAction, 100);
        }
      }

      // Sanitize query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = sanitizeString(req.query[key], 100);
          }
        });
      }

      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      res.status(400).json({ error: 'Invalid input data' });
    }
  };
}

// Specific sanitizers for different input types
export const sanitizers = {
  username: input => sanitizeString(input, 20),
  email: input => sanitizeString(input, 254).toLowerCase(),
  chatMessage: input => sanitizeString(input, 500),
  playerName: input => sanitizeString(input, 50),
  gameAction: input => sanitizeString(input, 100),
};
