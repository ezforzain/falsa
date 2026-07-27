// Small file-upload helpers for the CNIC verification flow (and anywhere else a file needs to
// become something JSON-serializable). There's no real backend here — MSW handlers persist to
// localStorage — so an uploaded image is read as a base64 data URL rather than sent as
// multipart/form-data to a server.

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB, mirrors Laravel's `max:4096` (KB)

// Returns an error message if the file fails validation, or null if it's fine.
export function validateImageFile(file) {
  if (!file) return 'Please choose a file.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Only JPG or PNG images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 4MB or smaller.';
  return null;
}

// Broader document upload (business registration certificates etc.) — same idea as
// validateImageFile above, but also accepts PDF and allows a larger ceiling.
export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5MB

export function validateDocumentFile(file) {
  if (!file) return 'Please choose a file.';
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) return 'Only PDF, JPG, or PNG files are allowed.';
  if (file.size > MAX_DOCUMENT_BYTES) return 'File must be 5MB or smaller.';
  return null;
}

// Product photo uploads go through the real backend (server/src/middleware/upload.js), which
// also accepts WEBP and allows up to 8MB — mirrored here so an oversized or unsupported file is
// rejected immediately instead of only after a round trip to the server.
export const ALLOWED_PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB, matches the server upload limit

export function validateProductImageFile(file) {
  if (!file) return 'Please choose a file.';
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, or WEBP images are allowed.';
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return 'Image must be 8MB or smaller.';
  return null;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}
