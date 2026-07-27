// No browser other than Safari can decode HEIC/HEIF (the format iPhones save photos in by
// default), so a raw HEIC File would show as a broken image everywhere else — as a preview here,
// and later wherever it's displayed (product galleries, KYC review, etc). This converts it to a
// JPEG File client-side, right when it's selected, so every downstream consumer (previews,
// uploads, base64 data URLs) only ever sees a normal, universally-displayable image.
//
// heic2any is dynamically imported so its (fairly large) WASM decoder is only downloaded the
// moment a HEIC file is actually encountered, not as part of the main bundle.
let heic2anyPromise;
function loadHeic2any() {
  if (!heic2anyPromise) heic2anyPromise = import('heic2any').then((m) => m.default);
  return heic2anyPromise;
}

const HEIC_EXT_RE = /\.hei[cf]$/i;

export function isHeicFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  return HEIC_EXT_RE.test(file.name || '');
}

// Returns the original file untouched if it isn't HEIC. Throws if conversion fails (e.g. a
// corrupted or unsupported HEIC variant) — callers should catch this and show a friendly error
// rather than silently uploading/previewing something no browser can display.
export async function toDisplayableImage(file) {
  if (!isHeicFile(file)) return file;

  const heic2any = await loadHeic2any();
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(HEIC_EXT_RE, '.jpg') || 'photo.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}

// Factory for a plain `<input type="file" onChange>` handler that converts HEIC to JPEG before
// handing the file to `setFile`, with a friendly `onError` callback if conversion fails. Shared
// by the couple of places (AuthPage signup, SellerSettings KYC resubmit) that still use a raw
// file input instead of the DragDropUpload component, so the HEIC handling isn't duplicated.
export function createHeicAwareFileHandler(setFile, onError) {
  return async (e) => {
    const raw = e.target.files?.[0] || null;
    e.target.value = ''; // allow re-selecting the same file after a failed attempt
    if (!raw) {
      setFile(null);
      return;
    }
    try {
      setFile(await toDisplayableImage(raw));
    } catch {
      setFile(null);
      onError?.('Could not process that photo. Please try a different file.');
    }
  };
}
