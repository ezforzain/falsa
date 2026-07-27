// Multipart file upload to POST /api/uploads/:type — kept separate from lib/api.js's request()
// helper since that one always sends/expects JSON, while this sends a real file body. Mirrors
// the same friendly-error behavior: our own route always returns a safe, displayable message on
// failure, anything else (5xx, no body) is technical detail swapped for a generic message.
import { ApiError } from './api';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

// type is one of "cnic" | "business-docs" | "products" — see server/src/middleware/upload.js.
export async function uploadFile(type, file) {
  const formData = new FormData();
  formData.append('file', file);

  let res;
  try {
    res = await fetch(`${API_BASE}/api/uploads/${encodeURIComponent(type)}`, {
      method: 'POST',
      body: formData,
      credentials: API_BASE ? 'include' : 'same-origin',
    });
  } catch (networkErr) {
    // eslint-disable-next-line no-console
    console.error(`Upload network error (${type}):`, networkErr);
    throw new ApiError('Unable to connect. Please check your internet connection and try again.', 0);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status >= 500 || !data?.message) {
      // eslint-disable-next-line no-console
      console.error(`Upload failed (${type}, ${res.status}):`, data?.message || res.statusText);
      throw new ApiError('Something went wrong. Please try again.', res.status);
    }
    throw new ApiError(data.message, res.status);
  }
  return data; // { url }
}
