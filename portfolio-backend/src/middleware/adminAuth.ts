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
  const rawHeader = req.headers['x-admin-key'];
  const headerKey = typeof rawHeader === 'string' ? rawHeader.trim() : Array.isArray(rawHeader) ? rawHeader[0]?.trim() : undefined;
  const authHeader = req.headers['authorization'];
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
  const queryKey = typeof req.query.key === 'string' ? req.query.key.trim() : undefined;

  const providedKey = headerKey || bearerKey || queryKey;
  const configuredKey = (env.ADMIN_API_KEY || '').trim();

  if (!providedKey || !configuredKey || providedKey !== configuredKey) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing admin credentials.'
    });
    return;
  }

  next();
}
