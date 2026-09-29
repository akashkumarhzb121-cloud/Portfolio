import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  env: {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
    SMTP_USER: 'sender@example.com',
    SMTP_PASSWORD: 'test-password',
    SMTP_FROM_EMAIL: 'sender@example.com',
    SMTP_FROM_NAME: 'Portfolio Contact',
    CONTACT_EMAIL: 'recipient@example.com'
  }
}));

vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: unknown[]) => mocks.createTransport(...args) }
}));

vi.mock('../src/config/env.js', () => ({ env: mocks.env }));

describe('sendContactNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.assign(mocks.env, {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_USER: 'sender@example.com',
      SMTP_PASSWORD: 'test-password',
      SMTP_FROM_EMAIL: 'sender@example.com',
      SMTP_FROM_NAME: 'Portfolio Contact',
      CONTACT_EMAIL: 'recipient@example.com'
    });
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
    mocks.sendMail.mockResolvedValue({ messageId: 'smtp-message-id' });
  });

  it('sends the enquiry through SMTP', async () => {
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Jane Doe',
      email: 'jane@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toEqual({
      success: true,
      messageId: 'smtp-message-id'
    });
    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        connectionTimeout: 10000
      })
    );
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        replyTo: 'jane@example.com'
      })
    );
  });

  it('returns a failure when SMTP is not configured', async () => {
    mocks.env.SMTP_USER = '';
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Akash Kumar',
      email: 'akash@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toMatchObject({
      success: false,
      error: 'SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD.'
    });
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });

  it('returns an SMTP error without trying another provider', async () => {
    mocks.sendMail.mockRejectedValue(
      Object.assign(new Error('SMTP connection timeout'), { code: 'ETIMEDOUT' })
    );
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Jane Doe',
      email: 'jane@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toEqual({
      success: false,
      error: 'SMTP connection timeout',
      errorCode: 'ETIMEDOUT'
    });
    expect(mocks.sendMail).toHaveBeenCalledOnce();
  });

  it('includes a safe SMTP response code for provider authentication errors', async () => {
    mocks.sendMail.mockRejectedValue(
      Object.assign(new Error('Authentication failed'), {
        code: 'EAUTH',
        responseCode: 535
      })
    );
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Jane Doe',
      email: 'jane@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toMatchObject({
      success: false,
      errorCode: 'EAUTH/SMTP_535'
    });
  });
});
