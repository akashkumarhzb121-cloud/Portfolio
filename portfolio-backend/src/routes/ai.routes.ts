import { Router } from 'express';
import {
  handleAIChat,
  handleAILead,
  getAdminConversations,
  getAdminConversationById,
  deleteAdminConversation,
  clearAdminConversations
} from '../controllers/ai.controller.js';
import { aiRateLimiter } from '../middleware/aiRateLimiter.js';
import { requireAdminAuth } from '../middleware/adminAuth.js';

const router = Router();

// Public Assistant Routes
// POST /api/ai/chat
router.post('/chat', aiRateLimiter, handleAIChat);

// POST /api/ai/lead
router.post('/lead', aiRateLimiter, handleAILead);

// Protected Admin Conversation Management Routes
// GET /api/ai/admin/conversations
router.get('/admin/conversations', requireAdminAuth, getAdminConversations);

// GET /api/ai/admin/conversations/:conversationId
router.get('/admin/conversations/:conversationId', requireAdminAuth, getAdminConversationById);

// DELETE /api/ai/admin/conversations/:conversationId
router.delete('/admin/conversations/:conversationId', requireAdminAuth, deleteAdminConversation);

// DELETE /api/ai/admin/conversations
router.delete('/admin/conversations', requireAdminAuth, clearAdminConversations);

export default router;
