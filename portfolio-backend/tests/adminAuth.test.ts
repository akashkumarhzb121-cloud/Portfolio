import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAdminAuth } from '../src/middleware/adminAuth.js';

vi.mock('../src/config/env.js', () => ({
  env: {
    ADMIN_API_KEY: 'Sonan@121'
  }
}));

describe('requireAdminAuth middleware', () => {
  const createMockReqRes = (overrides: Partial<Request> = {}) => {
    const req = {
      headers: {},
      query: {},
      ...overrides
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  };

  it('allows access with exact x-admin-key header', () => {
    const { req, res, next } = createMockReqRes({
      headers: { 'x-admin-key': 'Sonan@121' }
    });

    requireAdminAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows access with trimmed x-admin-key header', () => {
    const { req, res, next } = createMockReqRes({
      headers: { 'x-admin-key': '  Sonan@121  ' }
    });

    requireAdminAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows access with Authorization: Bearer token', () => {
    const { req, res, next } = createMockReqRes({
      headers: { authorization: 'Bearer Sonan@121' }
    });

    requireAdminAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows access with query param ?key=Sonan@121', () => {
    const { req, res, next } = createMockReqRes({
      query: { key: 'Sonan@121' }
    });

    requireAdminAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows access when header is an array of strings', () => {
    const { req, res, next } = createMockReqRes({
      headers: { 'x-admin-key': ['Sonan@121'] as unknown as string }
    });

    requireAdminAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects with 401 when no key is provided', () => {
    const { req, res, next } = createMockReqRes();

    requireAdminAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Unauthorized')
      })
    );
  });

  it('rejects with 401 when wrong key is provided', () => {
    const { req, res, next } = createMockReqRes({
      headers: { 'x-admin-key': 'wrong_key' }
    });

    requireAdminAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
