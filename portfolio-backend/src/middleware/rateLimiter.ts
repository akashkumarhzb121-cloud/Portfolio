import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env.NODE_ENV === 'test' ? 100 : 5, // 5 submissions per 15 minutes in production
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact requests from this network. Please wait 15 minutes before retrying or reach out directly via email.'
  },
  statusCode: 429
});
