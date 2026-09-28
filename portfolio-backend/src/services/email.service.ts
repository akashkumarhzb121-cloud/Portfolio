import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';
import type { ContactInput } from '../schemas/contact.schema.js';

let resendClient: Resend | null = null;
let smtpTransporter: Transporter | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY || '');
  }
  return resendClient;
}

function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    const pass = (env.SMTP_PASSWORD || '').replace(/\s+/g, '');
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: {
        user: env.SMTP_USER,
        pass
      }
    });
  }
  return smtpTransporter;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: 'smtp' | 'resend' | 'simulated';
}

export async function sendContactNotification(
  input: ContactInput,
  metadata?: { ip?: string; createdAt?: Date }
): Promise<SendNotificationResult> {
  // If in test environment without real credentials, return simulated success
  if (
    env.NODE_ENV === 'test' &&
    (!env.SMTP_USER || env.SMTP_USER === 'test@example.com') &&
    (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_test_key')
  ) {
    return { success: true, messageId: 'simulated-test-id', provider: 'simulated' };
  }

  const formattedDate = (metadata?.createdAt || new Date()).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const subject = `New Portfolio Enquiry: [${input.service}] from ${input.name}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #e2e8f0; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #13141c; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; border-bottom: 2px solid #06b6d4; }
          .header h1 { margin: 0; font-size: 20px; color: #38bdf8; font-weight: 700; }
          .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; }
          .content { padding: 24px; }
          .field { margin-bottom: 18px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
          .value { font-size: 15px; color: #f8fafc; word-break: break-word; }
          .message-box { background: #0b0c10; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-top: 6px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #f1f5f9; }
          .footer { padding: 16px 24px; background: #0b0c10; border-top: 1px solid #1f2937; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Client Enquiry Received</h1>
            <p>Submitted via your portfolio contact form at ${formattedDate} (IST)</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Sender Name</div>
              <div class="value"><strong>${escapeHtml(input.name)}</strong></div>
            </div>
            <div class="field">
              <div class="label">Sender Email</div>
              <div class="value"><a href="mailto:${escapeHtml(input.email)}" style="color: #38bdf8;">${escapeHtml(input.email)}</a></div>
            </div>
            <div class="field">
              <div class="label">Requested Service / Area</div>
              <div class="value" style="color: #a78bfa; font-weight: 600;">${escapeHtml(input.service)}</div>
            </div>
            <div class="field">
              <div class="label">Project Summary & Message</div>
              <div class="message-box">${escapeHtml(input.message)}</div>
            </div>
          </div>
          <div class="footer">
            IP: ${escapeHtml(metadata?.ip || 'N/A')} · Direct reply to: ${escapeHtml(input.email)}
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
New Portfolio Enquiry Received
------------------------------
Date: ${formattedDate}
Name: ${input.name}
Email: ${input.email}
Service: ${input.service}
IP: ${metadata?.ip || 'N/A'}

Project Message:
${input.message}
  `.trim();

  let smtpError: string | undefined;

  // 1. Primary: If SMTP credentials are configured (e.g. Gmail SMTP), send via Nodemailer
  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      const transporter = getSmtpTransporter();
      const fromName = env.SMTP_FROM_NAME || 'Portfolio Contact';
      const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER;
      const recipient = env.CONTACT_EMAIL || env.SMTP_USER;

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient,
        replyTo: input.email,
        subject,
        html: htmlContent,
        text: textContent
      });

      console.log(`✅ Enquiry email dispatched via SMTP to ${recipient} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (smtpErr: unknown) {
      smtpError = smtpErr instanceof Error ? smtpErr.message : 'SMTP dispatch failure';
      console.error('❌ SMTP dispatch error:', smtpError);
    }
  }

  // 2. Fallback: Use Resend over HTTPS if SMTP is unavailable or not configured.
  if (env.RESEND_API_KEY) {
    try {
      const resend = getResendClient();
      const { data, error } = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: [env.CONTACT_EMAIL],
        replyTo: input.email,
        subject,
        html: htmlContent,
        text: textContent
      });

      if (error) {
        console.error('❌ Resend API returned error:', error);
        const resendError = error.message || 'Email delivery failed';
        return {
          success: false,
          error: smtpError
            ? `SMTP delivery failed: ${smtpError}. Resend delivery failed: ${resendError}`
            : resendError,
          provider: 'resend'
        };
      }

      console.log(`✅ Enquiry email dispatched via Resend to ${env.CONTACT_EMAIL}`);
      return { success: true, messageId: data?.id, provider: 'resend' };
    } catch (resendErr: unknown) {
      const resendError = resendErr instanceof Error ? resendErr.message : 'Resend dispatch failure';
      console.error('❌ Resend sendContactNotification error:', resendError);
      return {
        success: false,
        error: smtpError
          ? `SMTP delivery failed: ${smtpError}. Resend delivery failed: ${resendError}`
          : resendError,
        provider: 'resend'
      };
    }
  }

  return {
    success: false,
    error: smtpError
      ? `SMTP delivery failed: ${smtpError}. Configure RESEND_API_KEY to enable HTTPS fallback.`
      : 'No email transport configured. Please configure SMTP_USER/SMTP_PASSWORD or RESEND_API_KEY.',
    provider: smtpError ? 'smtp' : undefined
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
