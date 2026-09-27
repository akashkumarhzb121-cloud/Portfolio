import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle invalid JSON body syntax errors
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received'
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      errors[key] = [val.message];
    }
    res.status(400).json({
      success: false,
      message: 'Database schema validation failed',
      errors
    });
    return;
  }

  console.error('Unhandled server error:', err);

  const errorMessage =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err instanceof Error
      ? err.message
      : 'Unknown server error';

  res.status(500).json({
    success: false,
    message: errorMessage
  });
}
