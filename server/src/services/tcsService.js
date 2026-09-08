// TCS Courier (E-COM API) client — every endpoint, payload shape, and response shape here is
// taken directly from TCS's "API User Guide v1.0" PDF. Nothing here is guessed: where the guide
// is genuinely ambiguous or self-inconsistent, that's called out in a comment next to the code
// working around it, rather than silently papering over it.
//
// Auth model per the guide (two separate tokens, both required on most calls):
//   1. A static bearer token (from TCS's top-level "Authorization" API, clientid/clientsecret) —
//      sent as `Authorization: Bearer <token>` on every E-COM/Tracking request. TCS handed us
//      this token directly (long-lived), so we just read it from env — see getBearerToken().
//   2. A short-lived "accesstoken" (from the E-COM "Authentication" API, username/password) —
//      embedded as a JSON body field on the specific calls whose documented sample payload
//      includes it (Booking-Create, Create Cost Center Code, Cancel, Payment Invoice, Reverse,
//      CN Print, Payment Detail, Cost Center Inquiry). getEcomAccessToken() fetches + caches it.
//
// All amounts/config used to build a shipment (shipper account, cost center, service code,
// weight, etc.) are passed in by the caller — this module never invents shipment data.

import axios from 'axios';

// ---------- Errors ----------

// Our own env/config is missing something required — a deploy/setup problem, not a bad request.
export class TcsConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TcsConfigError';
  }
}

// Input handed to this service (from the order, the admin form, or TCS-required formatting)
// failed validation before any network call was made.
export class TcsValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TcsValidationError';
  }
}

// TCS's own API rejected or failed the call. `status` mirrors the HTTP status TCS responded
// with (see the Status Codes table on the last page of the guide) so route handlers can pass it
// through sensibly; `traceid`/`raw` are kept for support/debugging, never shown to buyers.
export class TcsApiError extends Error {
  constructor(message, { status = 502, code = null, traceid = null, raw = null } = {}) {
    super(message);
    this.name = 'TcsApiError';
    this.status = status;
    this.code = code;
    this.traceid = traceid;
    this.raw = raw;
  }
}

// ---------- Config ----------

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new TcsConfigError(`Missing ${name} — set it in server/.env before using TCS shipping.`);
  }
  return value;
}

function getBaseUrl() {
  return (process.env.TCS_BASE_URL || 'https://devconnect.tcscourier.com').replace(/\/$/, '');
}

function getStaticBearerToken() {
  return requiredEnv('TCS_BEARER_TOKEN');
}

function getShipperAccount() {
  return {
    tcsaccount: requiredEnv('TCS_TCSACCOUNT'),
    shippername: process.env.TCS_SHIPPER_BRAND_NAME || 'Falsafah',
  };
}

// Throws early with a clear config error rather than letting a shipment attempt fail deep inside
// an axios call — used by the admin routes before they even open the "Ship via TCS" form.
export function assertConfigured() {
  requiredEnv('TCS_BEARER_TOKEN');
  requiredEnv('TCS_USERNAME');
  requiredEnv('TCS_PASSWORD');
  requiredEnv('TCS_TCSACCOUNT');
}

// ---------- Low-level request helper ----------

// Normalizes the several different error shapes the guide shows across its endpoints:
//   { error: [{ errorname }], message, traceid }
//   { code, message, status }
//   { result: null, status: false, code }
//   { MESSAGE, status, traceid }   (Get CN Update's failure shape is 200 + this body)
function buildTcsApiError(status, body) {
  let message = `TCS request failed (${status}).`;
  if (body) {
    if (Array.isArray(body.error) && body.error.length) {
      message = body.error.map((e) => e?.errorname).filter(Boolean).join('; ') || body.message || message;
    } else if (body.message) {
      message = body.message;
    } else if (body.MESSAGE) {
      message = body.MESSAGE;
    }
  }
  return new TcsApiError(message, {
    status,
    code: body?.code ? String(body.code) : String(status),
    traceid: body?.traceid || null,
    raw: body,
  });
}

// The guide documents several of these APIs as GET with a "JSON Body Request/Payload" (e.g.
// Authentication, Area Code, Tracking). That's misleading: verified directly against the TCS
// sandbox, a GET call with a JSON body gets the body silently dropped (TCS reports the fields as
// missing) — the same fields are actually read as query-string parameters. So every GET call
// here sends `data` as query params instead of a body; POST calls still send it as a JSON body,
// matching the doc. The bearer header is required on every call, Authentication included, even
// though that one endpoint's table doesn't list a "Bearer Token" row (also confirmed directly).
async function tcsRequest({ method, url, data, includeBearer = true }) {
  const isGet = String(method).toUpperCase() === 'GET';
  let res;
  try {
    res = await axios({
      method,
      url: `${getBaseUrl()}${url}`,
      data: isGet ? undefined : data,
      params: isGet ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(includeBearer ? { Authorization: `Bearer ${getStaticBearerToken()}` } : {}),
      },
      timeout: 20000,
      // We handle every status ourselves (TCS puts real error detail in 200s and 4xxs alike).
      validateStatus: () => true,
    });
  } catch (err) {
    if (err instanceof TcsConfigError) throw err;
    throw new TcsApiError('Unable to reach TCS courier service. Please try again.', {
      status: 502,
      raw: err.message,
    });
  }

  if (res.status >= 200 && res.status < 300) return res.data;
  throw buildTcsApiError(res.status, res.data);
}

// ---------- Ecom Authentication token (username/password) ----------

let ecomTokenCache = null; // { value, expiresAt }

export async function getEcomAccessToken({ force = false } = {}) {
  if (!force && ecomTokenCache && ecomTokenCache.expiresAt - Date.now() > 60_000) {
    return ecomTokenCache.value;
  }
  const username = requiredEnv('TCS_USERNAME');
  const password = requiredEnv('TCS_PASSWORD');
  // The guide's table for this endpoint has no "Bearer Token: Provided in Authorization API" row
  // (unlike every other endpoint), which reads as "doesn't need one" — but TCS's actual server
  // rejects this call without the bearer header too (401 "Invalid Bearer token"), confirmed
  // against the sandbox. So: send it, same as everywhere else.
  const data = await tcsRequest({
    method: 'GET',
    url: '/ecom/api/authentication/token',
    data: { username, password },
  });
  if (!data?.accesstoken) {
    throw new TcsApiError(data?.message || 'TCS did not return an access token.', { raw: data });
  }
  const expiresAt = data.expiry ? new Date(data.expiry).getTime() : Date.now() + 15 * 60_000;
  ecomTokenCache = { value: data.accesstoken, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 15 * 60_000 };
  return ecomTokenCache.value;
}

// ---------- Formatting / validation helpers ----------

const PK_MOBILE_RE = /^03\d{9}$/;

// TCS wants an 11-digit 03XXXXXXXXX mobile number (see e.g. Booking-Create's shipperinfo.mobile
// remarks). Buyer/seller phone numbers in this app aren't validated to that shape at entry, so
// this normalizes common variants (+92/0092 prefix, spaces/dashes) and otherwise fails loudly
// rather than sending TCS something it will reject or silently mis-book.
export function normalizePkMobile(raw, label) {
  const digits = String(raw || '').replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('92') && normalized.length === 12) normalized = `0${normalized.slice(2)}`;
  if (normalized.startsWith('0092')) normalized = `0${normalized.slice(4)}`;
  if (!PK_MOBILE_RE.test(normalized)) {
    throw new TcsValidationError(`${label} must be an 11-digit mobile number like 03001234567.`);
  }
  return normalized;
}

// Booking-Create's consigneeinfo marks BOTH firstname and middlename mandatory, but this app
// only collects one free-text full name at checkout. Rather than inventing a middle name, the
// single name is reused for both fields when there isn't a real middle part.
export function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) throw new TcsValidationError('Buyer name is required.');
  if (parts.length === 1) return { firstname: parts[0], middlename: parts[0], lastname: '' };
  if (parts.length === 2) return { firstname: parts[0], middlename: parts[0], lastname: parts[1] };
  return { firstname: parts[0], middlename: parts.slice(1, -1).join(' '), lastname: parts[parts.length - 1] };
}

// Field spec for shipmentdate says "DD-MM-YYYY" (the sample payload uses a different
// slash+timestamp format, but the type/remarks column is the actual contract) — and the field is
// optional, so this is only ever a best-effort hint to TCS, never load-bearing.
function formatTcsDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getFullYear()}`;
}

// ---------- Booking – Create ----------

// `order` is a SellerOrder document (needs shippingAddress, productName, qty, unitPrice, _id).
// `seller` fields describe the pickup point — this app has no structured city field for a
// seller's business address, so sellerCity/sellerMobile are supplied by whoever fills the
// admin "Ship via TCS" form, not invented here.
export async function createShipment({
  order,
  sellerCompanyName,
  sellerAddress,
  sellerCity,
  sellerMobile,
  costcentercode,
  servicecode,
  weightinkg,
  pieces,
  currency = 'PKR',
  codamount = 0,
  contentdesc = '',
  remarks = '',
}) {
  if (!order?.shippingAddress?.address) throw new TcsValidationError('This order has no delivery address on file.');
  if (!sellerCity?.trim()) throw new TcsValidationError('Seller pickup city is required.');
  if (!costcentercode?.trim()) throw new TcsValidationError('Cost center is required.');
  if (!servicecode?.trim()) throw new TcsValidationError('Service code is required.');
  if (!Number.isFinite(Number(weightinkg)) || Number(weightinkg) < 0.5) {
    throw new TcsValidationError('Weight must be at least 0.5 kg.');
  }
  if (!Number.isFinite(Number(pieces)) || Number(pieces) < 1) {
    throw new TcsValidationError('Pieces must be at least 1.');
  }

  const accesstoken = await getEcomAccessToken();
  const { tcsaccount, shippername } = getShipperAccount();
  const shipperMobile = normalizePkMobile(sellerMobile, 'Seller pickup mobile');
  const consigneeMobile = normalizePkMobile(order.shippingAddress.phone, 'Buyer mobile number');
  const { firstname, middlename, lastname } = splitFullName(order.shippingAddress.fullName);

  const body = {
    accesstoken,
    consignmentno: '',
    shipperinfo: {
      tcsaccount,
      shippername,
      address1: sellerCompanyName || 'Falsafah seller',
      address2: sellerAddress || '',
      address3: '',
      zip: '',
      countrycode: 'PK',
      countryname: 'Pakistan',
      citycode: '',
      cityname: sellerCity.trim(),
      mobile: shipperMobile,
    },
    consigneeinfo: {
      consigneecode: '',
      firstname,
      middlename,
      lastname,
      address1: order.shippingAddress.address,
      address2: '',
      address3: '',
      zip: '',
      countrycode: 'PK',
      countryname: 'Pakistan',
      citycode: '',
      cityname: order.shippingAddress.city,
      email: '',
      areacode: '',
      areaname: '',
      blockcode: '',
      blockname: '',
      lat: '',
      lng: '',
      landmark: '',
      mobile: consigneeMobile,
    },
    vendorinfo: {
      name: sellerCompanyName || '',
      address1: sellerAddress || '',
      address2: '',
      address3: '',
      citycode: '',
      cityname: sellerCity.trim(),
      mobile: shipperMobile,
    },
    shipmentinfo: {
      costcentercode: costcentercode.trim(),
      referenceno: String(order._id),
      contentdesc: contentdesc || order.productName || '',
      servicecode: servicecode.trim(),
      parametertype: '',
      shipmentdate: formatTcsDate(new Date()),
      shippingtype: '',
      currency,
      codamount: Math.max(0, Math.round(Number(codamount) || 0)),
      declaredvalue: null,
      insuredvalue: null,
      transactiontype: '',
      dsflag: '',
      carrierslug: '',
      weightinkg: Number(weightinkg),
      pieces: Number(pieces),
      fragile: false,
      remarks: remarks || '',
      skus: [
        {
          description: contentdesc || order.productName || '',
          quantity: order.qty,
          weight: Number(weightinkg),
          uom: 'KG',
          unitprice: Math.round(order.unitPrice),
          declaredvalue: null,
          insuredvalue: null,
        },
      ],
    },
  };

  const data = await tcsRequest({ method: 'POST', url: '/ecom/api/booking/create', data: body });
  if (!data?.consignmentNo) {
    throw new TcsApiError(data?.message || 'TCS did not return a consignment number.', { raw: data });
  }
  return data; // { consignmentNo, message, traceid }
}

// ---------- Booking – Create Cost Center Code ----------
// A cost center must exist on your TCS account before Booking-Create will accept its code (see
// costCenterInquiry above, which lists whatever already exists). This creates a new one — used
// once during setup, not part of the per-order flow.

export async function createCostCenter({
  costcentercityname,
  costcentercode,
  costcentername,
  pickupaddress,
  returnaddress,
  islabelprint = 'yes',
  phoneNumber = '',
  email = '',
}) {
  if (!costcentercityname?.trim()) throw new TcsValidationError('Cost center city is required.');
  if (!costcentercode?.trim()) throw new TcsValidationError('Cost center code is required.');
  if (!costcentername?.trim()) throw new TcsValidationError('Cost center name is required.');
  if (!pickupaddress?.trim()) throw new TcsValidationError('Pickup address is required.');
  if (!returnaddress?.trim()) throw new TcsValidationError('Return address is required.');

  const accesstoken = await getEcomAccessToken();
  const { tcsaccount } = getShipperAccount();
  return tcsRequest({
    method: 'POST',
    url: '/ecom/api/booking/createcostcentercode',
    data: {
      costcentercityname: costcentercityname.trim(),
      costcentercode: costcentercode.trim(),
      costcentername: costcentername.trim(),
      pickupaddress: pickupaddress.trim(),
      returnaddress: returnaddress.trim(),
      islabelprint,
      accountNumber: tcsaccount,
      phoneNumber,
      email,
      accesstoken,
    },
  });
}

// ---------- Booking – Cancel ----------

export async function cancelShipment(consignmentNumber) {
  const accesstoken = await getEcomAccessToken();
  return tcsRequest({
    method: 'POST',
    url: '/ecom/api/booking/cancel',
    data: { consignmentNumber: String(consignmentNumber), accesstoken },
  });
}

// ---------- Booking – Get CN Update ----------
// flag: per the guide, "2" is the value shown in the sample request/response.

export async function getCnUpdate(consignmentNo, flag = 2) {
  return tcsRequest({
    method: 'GET',
    url: '/ecom/api/booking/getcnupdate',
    data: { ID: String(consignmentNo), flag: String(flag) },
  });
}

// ---------- Inquiry – Cost Center Inquiry ----------
// Used to populate the admin "cost center" picker with real values from your TCS account instead
// of a guessed/hardcoded code.

export async function costCenterInquiry(customerno) {
  const accessToken = await getEcomAccessToken();
  // Two doc inaccuracies fixed here, both confirmed against the sandbox: the guide's URL
  // (.../ecom/inquiry/costcenterinquiry) 404s — the real path has an /api/ segment, matching
  // every other ecom endpoint, and its "Production Link"/"Sandbox Link" swap versus every other
  // entry is disregarded (we always use TCS_BASE_URL, same as the rest of this file).
  const data = await tcsRequest({
    method: 'GET',
    url: '/ecom/api/inquiry/costcenterinquiry',
    data: { accessToken, customerno: String(customerno) },
  });
  return data?.detail || [];
}

// ---------- CN Print ----------
// Returns the raw PDF bytes TCS generates for the consignment label/form — the guide's "API
// Success Response" for this endpoint is literally a downloadable PDF file, not a JSON body, so
// this bypasses tcsRequest() (which assumes JSON) and reads the response as binary instead.

export async function printLabel(consignmentNo, { shipperdetail = true, printtype } = {}) {
  const accesstoken = await getEcomAccessToken();
  let res;
  try {
    res = await axios({
      method: 'GET',
      url: `${getBaseUrl()}/ecom/api/print/label`,
      // GET calls take their fields as query params, not a JSON body — see tcsRequest() above.
      params: {
        consignmentno: String(consignmentNo),
        shipperdetail: String(Boolean(shipperdetail)),
        ...(printtype ? { printtype } : {}),
        accesstoken,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getStaticBearerToken()}`,
      },
      responseType: 'arraybuffer',
      timeout: 20000,
      validateStatus: () => true,
    });
  } catch (err) {
    throw new TcsApiError('Unable to reach TCS courier service for the label. Please try again.', {
      status: 502,
      raw: err.message,
    });
  }

  const contentType = res.headers?.['content-type'] || '';
  if (res.status >= 200 && res.status < 300 && contentType.includes('pdf')) {
    return Buffer.from(res.data);
  }
  // TCS returned JSON (its documented failure shape is { message: "CN not found", url, traceid })
  // instead of a PDF — decode it so the caller gets TCS's real message, not a generic one.
  let body = null;
  try {
    body = JSON.parse(Buffer.from(res.data).toString('utf8'));
  } catch {
    // Not JSON either — fall through with body left null.
  }
  throw buildTcsApiError(res.status, body || { message: 'TCS did not return a label PDF.' });
}

// ---------- Tracking ----------

export async function trackShipment(consignmentNo) {
  return tcsRequest({
    method: 'GET',
    url: '/tracking/api/Tracking/GetDynamicTrackDetail',
    // The guide's sample shows `consignee` as a one-element array, but as a query param (see the
    // note on tcsRequest above) that shape fails ASP.NET model binding ("consignee field is
    // required") — confirmed against the sandbox, a plain string value is what actually works.
    data: { consignee: String(consignmentNo) },
  });
}
