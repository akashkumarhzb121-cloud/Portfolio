import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Middleware to protect admin management endpoints.
 * Accepts the key via 'x-admin-key' header, 'Authorization: Bearer <key>', or query param '?key=<key>'.
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const headerKey = req.headers['x-admin-key'];
  const authHeader = req.headers['authorization'];
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
  const queryKey = typeof req.query.key === 'string' ? req.query.key : undefined;

  const providedKey = headerKey || bearerKey || queryKey;

  if (!providedKey || providedKey !== env.ADMIN_API_KEY) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing admin credentials.'
    });
    return;
  }

  next();
}
