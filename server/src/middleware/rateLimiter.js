import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';

// Auth rate limiter - stricter for login/register attempts
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address for rate limiting
  keyGenerator: req => req.ip,
  // Skip successful requests in count
  skipSuccessfulRequests: true,
});

// General API rate limiter - more lenient for general API usage
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip,
});

// Strict limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:reset:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip,
});
