import { setDefaultResultOrder } from 'node:dns';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import type { ContactInput } from '../schemas/contact.schema.js';

setDefaultResultOrder('ipv4first');

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      requireTLS: env.SMTP_PORT !== 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD?.replace(/\s+/g, '')
      }
    });
  }
  return smtpTransporter;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

function getSmtpErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const codes: string[] = [];
  if ('code' in error && typeof error.code === 'string') {
    codes.push(error.code);
  }
  if ('responseCode' in error && typeof error.responseCode === 'number') {
    codes.push(`SMTP_${error.responseCode}`);
  }
  return codes.length > 0 ? codes.join('/') : undefined;
}

export async function sendContactNotification(input: ContactInput): Promise<SendNotificationResult> {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    return {
      success: false,
      error: 'SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD.'
    };
  }

  const recipient = env.CONTACT_EMAIL;

  try {
    const transporter = getSmtpTransporter();
    const info = await transporter.sendMail({
      from: {
        name: env.SMTP_FROM_NAME,
        address: env.SMTP_FROM_EMAIL || env.SMTP_USER
      },
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

    console.log(`Contact notification sent via SMTP to ${recipient} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP delivery error';
    const errorCode = getSmtpErrorCode(error);
    console.error('SMTP contact notification failed:', {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      errorCode,
      message
    });
    return { success: false, error: message, errorCode };
  }
}
