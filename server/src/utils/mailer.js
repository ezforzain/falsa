import { Resend } from 'resend';

// Lazily constructed so a missing RESEND_API_KEY doesn't crash the server at boot — it only
// matters the moment something actually tries to send, and fails loudly (see sendVerificationEmail)
// rather than silently, when it does.
let client = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// First entry of CLIENT_ORIGIN (same var CORS already reads — see app.js) is treated as the
// canonical frontend URL for building links inside emails.
export function getClientUrl() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return raw.split(',')[0].trim().replace(/\/$/, '');
}

export async function sendVerificationEmail(user, token) {
  const resend = getClient();
  if (!resend) {
    throw new Error('Email delivery is not configured (RESEND_API_KEY missing).');
  }
  const verifyUrl = `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const from = process.env.EMAIL_FROM || 'Falsafah <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to: user.email,
    subject: 'Verify your email — Falsafah',
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          Hi ${user.companyName || 'there'}, confirm this is your email address to finish setting up your Falsafah account.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #0E5A46; color: #fff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 999px;">
          Verify email
        </a>
        <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 24px 0 0;">
          This link expires in 24 hours. If you didn't create this account, you can ignore this email.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #999; margin: 16px 0 0; word-break: break-all;">
          Or paste this link into your browser: ${verifyUrl}
        </p>
      </div>
    `,
  });
}
