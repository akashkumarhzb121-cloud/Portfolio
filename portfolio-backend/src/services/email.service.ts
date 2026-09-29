import { Resend } from 'resend';
import { env } from '../config/env.js';
import type { ContactInput } from '../schemas/contact.schema.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  if ('code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'name' in error && typeof error.name === 'string' ? error.name : undefined;
}

export async function sendContactNotification(input: ContactInput): Promise<SendNotificationResult> {
  const recipient = env.CONTACT_EMAIL;

  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: recipient,
      replyTo: input.email,
      subject: `New Portfolio Enquiry: ${input.service} from ${input.name}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Service: ${input.service}`,
        '',
        'Message:',
        input.message
      ].join('\n')
    });

    if (error) {
      const errorCode = getErrorCode(error);
      console.error('Resend contact notification failed:', {
        recipient,
        errorCode,
        message: error.message
      });
      return { success: false, error: error.message, errorCode };
    }

    console.log(`Contact notification sent via Resend to ${recipient} (${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Resend delivery error';
    const errorCode = getErrorCode(error);
    console.error('Resend contact notification failed:', {
      recipient,
      errorCode,
      message
    });
    return { success: false, error: message, errorCode };
  }
}
