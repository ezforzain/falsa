import { Resend } from 'resend';

// Lazily constructed so a missing RESEND_API_KEY doesn't crash the server at boot — it only
// matters the moment something actually tries to send, and fails loudly (see sendVerificationOtpEmail)
// rather than silently, when it does.
let client = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Signup verification — a 6-digit code the user types back into the app (see
// createEmailVerificationOtp), same UX/template shape as the password-reset OTP below rather
// than a clicked link, so it isn't undeliverable-until-a-domain-is-verified in a different way
// per flow.
export async function sendVerificationOtpEmail(user, code) {
  const resend = getClient();
  if (!resend) {
    throw new Error('Email delivery is not configured (RESEND_API_KEY missing).');
  }
  const from = process.env.EMAIL_FROM || 'Falsafah <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to: user.email,
    subject: `${code} is your Falsafah verification code`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          Hi ${user.companyName || 'there'}, use this code in the app to confirm this is your email address.
        </p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; background: #f1f3f7; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
          ${code}
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 0;">
          This code expires in 10 minutes. If you didn't create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetOtpEmail(user, code) {
  const resend = getClient();
  if (!resend) {
    throw new Error('Email delivery is not configured (RESEND_API_KEY missing).');
  }
  const from = process.env.EMAIL_FROM || 'Falsafah <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to: user.email,
    subject: `${code} is your Falsafah password reset code`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
        <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          Hi ${user.companyName || 'there'}, use this code to reset your Falsafah account password:
        </p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; background: #f1f3f7; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
          ${code}
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #666; margin: 0;">
          This code expires in 10 minutes. If you didn't request a password reset, you can ignore this email — your password won't change.
        </p>
      </div>
    `,
  });
}
