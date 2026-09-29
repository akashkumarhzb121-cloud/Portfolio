import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constructor: vi.fn(),
  sendEmail: vi.fn(),
  env: { CONTACT_EMAIL: 'recipient@example.com' }
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mocks.sendEmail };

    constructor(apiKey: string) {
      mocks.constructor(apiKey);
    }
  }
}));

vi.mock('../src/config/env.js', () => ({ env: mocks.env }));

describe('sendContactNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_api_key';
    mocks.sendEmail.mockResolvedValue({
      data: { id: 'resend-message-id' },
      error: null
    });
  });

  it('sends the enquiry through Resend using the sandbox sender', async () => {
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Jane Doe',
      email: 'jane@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toEqual({
      success: true,
      messageId: 'resend-message-id'
    });
    expect(mocks.constructor).toHaveBeenCalledWith('re_test_api_key');
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'onboarding@resend.dev',
        to: 'recipient@example.com',
        replyTo: 'jane@example.com',
        subject: 'New Portfolio Enquiry: Full-Stack Web Development from Jane Doe',
        text: expect.stringContaining('Please contact me about a new project.')
      })
    );
  });

  it('returns a failure when Resend rejects the notification', async () => {
    mocks.sendEmail.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid recipient' }
    });
    const { sendContactNotification } = await import('../src/services/email.service.js');

    const result = await sendContactNotification({
      name: 'Akash Kumar',
      email: 'akash@example.com',
      service: 'Full-Stack Web Development',
      message: 'Please contact me about a new project.'
    });

    expect(result).toMatchObject({
      success: false,
      error: 'Invalid recipient',
      errorCode: 'validation_error'
    });
  });

  it('returns a failure when the Resend request throws', async () => {
    mocks.sendEmail.mockRejectedValue(
      Object.assign(new Error('Resend request failed'), { code: 'ECONNRESET' })
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
      error: 'Resend request failed',
      errorCode: 'ECONNRESET'
    });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();
  });
});
