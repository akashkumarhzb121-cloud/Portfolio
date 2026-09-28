import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  resendSend: vi.fn(),
  env: {
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'sender@example.com',
    SMTP_PASSWORD: 'test-password',
    SMTP_FROM_EMAIL: 'sender@example.com',
    SMTP_FROM_NAME: 'Portfolio Contact',
    RESEND_API_KEY: 're_test_key',
    CONTACT_EMAIL: 'recipient@example.com',
    EMAIL_FROM: 'Portfolio Contact <onboarding@resend.dev>'
  }
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: unknown[]) => mocks.createTransport(...args) }
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => mocks.resendSend(...args) };

    constructor(_apiKey: string) {}
  }
}));

vi.mock('../src/config/env.js', () => ({ env: mocks.env }));

describe('sendContactNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.assign(mocks.env, {
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_USER: 'sender@example.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM_EMAIL: 'sender@example.com',
      SMTP_FROM_NAME: 'Portfolio Contact',
      RESEND_API_KEY: 're_test_key',
      CONTACT_EMAIL: 'recipient@example.com',
      EMAIL_FROM: 'Portfolio Contact <onboarding@resend.dev>'
    });
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
    mocks.sendMail.mockRejectedValue(new Error('SMTP connection timeout'));
    mocks.resendSend.mockResolvedValue({
      data: { id: 'resend-message-id' },
      error: null
    });
  });

  it('falls back to Resend when SMTP fails', async () => {
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Jane Doe',
      email: 'jane@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toEqual({
      success: true,
      messageId: 'resend-message-id',
      provider: 'resend'
    });
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ connectionTimeout: 10000 })
    );
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    expect(mocks.resendSend).toHaveBeenCalledOnce();
  });

  it('returns the SMTP error when Resend is not configured', async () => {
    mocks.env.RESEND_API_KEY = '';
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Akash Kumar',
      email: 'akash@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toMatchObject({
      success: false,
      provider: 'smtp',
      error: expect.stringContaining('SMTP connection timeout')
    });
    expect(result.error).toContain('Configure RESEND_API_KEY');
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });
});
