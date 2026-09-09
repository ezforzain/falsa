// Resolves a possibly backend-relative upload path (e.g. "/uploads/avatars/xxx.jpg", exactly
// what POST /api/uploads/:type returns — see server/src/routes/upload.routes.js) into a URL the
// browser can actually load.
//
// Uploaded files are served BY THE API (server/src/app.js: app.use('/uploads', express.static(...))),
// not by the frontend. Whenever the frontend and API are on different origins — which is any real
// deployment where VITE_API_URL is set, same as lib/api.js/lib/upload.js already assume for every
// other request — a bare "/uploads/..." <img src> resolves against the FRONTEND's own origin
// instead and 404s there, since the frontend never serves that path. The upload itself succeeds
// and the URL gets saved fine; the photo just silently never displays, always falling back to the
// placeholder icon. This was the still-open half of the avatar/banner "broken image" issue — the
// PR that taught <Avatar> to fall back to the person icon on a load error (instead of the
// browser's broken-image glyph) made that failure look clean, but didn't fix why the image
// never loaded in the first place.
//
// Anything already absolute (http(s):// URLs — seeded mock images, a future CDN) or a local
// blob:/data: URL (an upload's own in-progress preview) passes through unchanged.
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export function resolveMediaUrl(url) {
  if (!url || !url.startsWith('/')) return url;
  return `${API_BASE}${url}`;
}
