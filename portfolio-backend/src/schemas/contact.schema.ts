import { z } from 'zod';

export const contactInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  service: z
    .string()
    .trim()
    .min(1, 'Please select a service or enquiry type')
    .max(100, 'Service cannot exceed 100 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message cannot exceed 5000 characters')
});

export type ContactInput = z.infer<typeof contactInputSchema>;
