import { z } from 'zod';
import { contactInputSchema } from './contact.schema.js';

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationId: z
    .string()
    .trim()
    .max(100, 'conversationId cannot exceed 100 characters')
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().max(4000)
      })
    )
    .max(20, 'History cannot exceed 20 items')
    .optional()
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const leadCaptureSchema = contactInputSchema;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
