import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller.js';
import { contactRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/contact with rate limiting
router.post('/contact', contactRateLimiter, submitContact);

export default router;
