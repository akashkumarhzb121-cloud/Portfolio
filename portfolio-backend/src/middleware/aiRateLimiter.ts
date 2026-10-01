import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const windowMinutes = Number(env.AI_RATE_LIMIT_WINDOW_MINUTES) || 15;
const maxRequests = Number(env.AI_RATE_LIMIT_MAX_REQUESTS) || 30;

export const aiRateLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 200 : maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many AI requests from this network. Please wait a few minutes before asking further questions, or reach out to Akash directly via the contact form.'
  },
  statusCode: 429
});
