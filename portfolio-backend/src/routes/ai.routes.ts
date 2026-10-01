import { Router } from 'express';
import { handleAIChat, handleAILead } from '../controllers/ai.controller.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';

const router = Router();

// POST /api/ai/chat
router.post('/chat', aiRateLimiter, handleAIChat);

// POST /api/ai/lead
router.post('/lead', aiRateLimiter, handleAILead);

export default router;
