import type { Request, Response, NextFunction } from 'express';
import { chatRequestSchema } from '../schemas/ai.schema.js';
import { generateChatResponse } from '../ai/llm/generate.js';
import { submitContact } from './contact.controller.js';

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
