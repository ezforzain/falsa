// Seller-facing SMS notifications (e.g. "New order received"). Uses Twilio's REST API directly
// over axios — same pattern as tcsService.js — rather than pulling in the Twilio SDK as a new
// dependency for what's a single POST call.
//
// Required env vars (server/.env):
//   TWILIO_ACCOUNT_SID  — from the Twilio console
//   TWILIO_AUTH_TOKEN   — from the Twilio console (a secret — server-side only, see getConfig)
//   TWILIO_PHONE_NUMBER — your Twilio sending number, in E.164 format (e.g. +15551234567)
// Until all three are set, sendSms() throws SmsConfigError — callers treat that as best-effort
// and log it rather than letting a missing SMS provider block an order from saving.
import axios from 'axios';
import { normalizePkMobile } from './tcsService.js';

export class SmsConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SmsConfigError';
  }
}

export class SmsSendError extends Error {
  constructor(message, { raw = null } = {}) {
    super(message);
    this.name = 'SmsSendError';
    this.raw = raw;
  }
}

// Twilio's real API host, overridable only for local testing against a mock server (mirrors
// TCS_BASE_URL in tcsService.js) — never set in a real deployment.
function getApiBase() {
  return (process.env.TWILIO_API_BASE_URL || 'https://api.twilio.com').replace(/\/$/, '');
}

// TWILIO_AUTH_TOKEN is read from process.env here and nowhere else in this module — it's never
// put on a response body, a log line, or anything serialized back to a client (see
// notifySellerNewOrder below, which only ever logs the message sid / a non-secret error string).
function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    throw new SmsConfigError(
      'SMS delivery is not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and ' +
        'TWILIO_PHONE_NUMBER in server/.env before sending SMS.'
    );
  }
  return { accountSid, authToken, fromNumber };
}

// Twilio wants E.164 (+92XXXXXXXXXX); the rest of this app stores/validates local 03XXXXXXXXX
// mobile numbers (see tcsService.normalizePkMobile) — this bridges the two.
function toE164Pk(rawPhone) {
  const local = normalizePkMobile(rawPhone, 'Seller phone');
  return `+92${local.slice(1)}`;
}

// Sends one SMS via Twilio's Messages API. Throws SmsConfigError (not configured) or
// SmsSendError (Twilio rejected/failed the request) — never resolves "successfully" on failure,
// so callers can distinguish and log real send failures from a missing setup.
export async function sendSms(toPhone, body) {
  const { accountSid, authToken, fromNumber } = getConfig();
  const to = toE164Pk(toPhone);
  const params = new URLSearchParams({ To: to, From: fromNumber, Body: body });

  try {
    const res = await axios.post(`${getApiBase()}/2010-04-01/Accounts/${accountSid}/Messages.json`, params, {
      auth: { username: accountSid, password: authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      validateStatus: () => true,
    });
    if (res.status >= 200 && res.status < 300) {
      return { sid: res.data?.sid || null, status: res.data?.status || null };
    }
    throw new SmsSendError(res.data?.message || `Twilio SMS request failed (${res.status}).`, { raw: res.data });
  } catch (err) {
    if (err instanceof SmsSendError) throw err;
    throw new SmsSendError('Unable to reach the SMS provider. Please try again.', { raw: err.message });
  }
}

// High-level helper for the one notification this app currently sends: telling a seller a new
// order landed. Best-effort by design — logs success/failure and never throws, since a failed
// SMS must never undo or block an already-saved order (see checkout.routes.js, which only calls
// this after every SellerOrder for the checkout is already written, and only once per seller).
export async function notifySellerNewOrder(sellerUser, { orderRef }) {
  const body =
    `New Order Received!\n` +
    `Order #${orderRef} has been placed on your Falsafah store.\n` +
    `Please open your Seller Portal to view and process the order.`;

  try {
    const result = await sendSms(sellerUser.phone, body);
    console.log(`SMS sent to seller ${sellerUser._id} for order ${orderRef} (sid=${result.sid || 'n/a'}).`);
    return { ok: true };
  } catch (err) {
    console.error(`SMS failed for seller ${sellerUser._id}, order ${orderRef}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}
