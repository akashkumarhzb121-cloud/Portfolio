import type { Request, Response, NextFunction } from 'express';
import { chatRequestSchema } from '../schemas/ai.schema.js';
import { generateChatResponse } from '../ai/llm/generate.js';
import { submitContact } from './contact.controller.js';
import { Conversation } from '../models/conversation.model.js';

/**
 * Controller for POST /api/ai/chat
 */
export async function handleAIChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid chat request payload.',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { message, conversationId, history } = parseResult.data;

    const result = await generateChatResponse({
      message,
      conversationId,
      history
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for POST /api/ai/lead
 * Directly bridges client leads captured via the AI assistant to the existing ContactEnquiry & email notification pipeline.
 */
export async function handleAILead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Delegate directly to the existing submitContact controller for 100% consistency
  await submitContact(req, res, next);
}

/**
 * Controller for GET /api/ai/admin/conversations
 * Returns recent conversation sessions with preview messages and metadata.
 */
export async function getAdminConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 100);
    const skip = Math.max(parseInt(req.query.skip as string, 10) || 0, 0);

    const [conversations, total] = await Promise.all([
      Conversation.find({})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({})
    ]);

    const formatted = conversations.map((conv) => {
      const msgs = conv.messages || [];
      const userMsgs = msgs.filter((m) => m.role === 'user');
      const assistantMsgs = msgs.filter((m) => m.role === 'assistant');

      return {
        conversationId: conv.conversationId,
        messageCount: msgs.length,
        firstUserQuery: userMsgs[0]?.content || '',
        lastUserQuery: userMsgs[userMsgs.length - 1]?.content || '',
        lastAssistantReply: assistantMsgs[assistantMsgs.length - 1]?.content || '',
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      total,
      count: formatted.length,
      conversations: formatted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for GET /api/ai/admin/conversations/:conversationId
 * Returns the full transcript of a specific conversation.
 */
export async function getAdminConversationById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ conversationId }).lean();

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: `Conversation '${conversationId}' not found.`
      });
      return;
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for DELETE /api/ai/admin/conversations/:conversationId
 * Deletes a specific conversation by ID.
 */
export async function deleteAdminConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { conversationId } = req.params;
    const deleted = await Conversation.findOneAndDelete({ conversationId });

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: `Conversation '${conversationId}' not found or already deleted.`
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Conversation '${conversationId}' deleted successfully.`,
      conversationId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for DELETE /api/ai/admin/conversations
 * Bulk deletes conversations (e.g. empty or all).
 */
export async function clearAdminConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await Conversation.deleteMany({});

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} conversation(s).`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
}
