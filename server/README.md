# Falsafah Tot API

Real Node.js/Express + MongoDB backend for the Falsafah Tot marketplace, built to the same
contract as the frontend's mock API (`src/lib/api.js` / `src/mocks/*`). The frontend still runs
against MSW for now — this server is standalone until it's wired in.

## Setup

```bash
cd server
npm install
cp .env.example .env   # adjust if your Mongo URI/JWT secret differ
npm run seed            # populates categories, products, and the sellers directory
npm run dev              # http://localhost:5000
```

Requires a MongoDB instance reachable at `MONGODB_URI` (defaults to
`mongodb://localhost:27017/falsafahtot`).

Seeding only populates catalog data — no user accounts. Buyer/seller accounts are created
through the app's normal sign-up flow (`POST /api/auth/signup`, restricted to those two roles).
Admin accounts aren't self-service — provision one with:

```bash
npm run create-admin -- --email you@company.com --password 'Str0ngPass!' --company "Falsafah HQ"
```

## Design notes / current limitations

- **Sign-in and sign-up are single-step** — password verified (or account created) and a JWT is
  issued directly for every account (buyer and seller), no OTP/verification-code gate, no admin
  approval step, and no separate seller identity/KYC check.
- **Forgot-password is disabled** (`POST /api/auth/forgot-password` returns 503) until a real
  email/SMS provider is wired up to deliver a reset code — there was previously a fixed dev-mode
  code here, which isn't a real verification step.
- **Auth is JWT-based and stateless.** `POST /api/auth/logout` just tells the client to discard
  its token; there's no server-side revoke list yet.
- **Cart and store-follows are guest-scoped**, not tied to login — matches the current frontend,
  which never sends an auth token to `/api/cart` or `/api/sellers/:id/follow`. Identity is an
  httpOnly `guestId` cookie set on first request. Once the frontend switches from `fetch(...)` to
  requests with `credentials: 'include'`, this will keep working unchanged.
- **Uploads are local disk**, served from `/uploads/*`. `POST /api/uploads/:type`
  (`business-docs` | `products`, multipart field `file`) returns `{ url }`; that URL is what you
  pass as `businessDocument`/`images[]` on the other endpoints — same shape the mock already
  validates ("images must be a list of URLs").
- Product IDs are human-readable slugs (e.g. `cotton-twill-fabric`), matching the existing mock
  data and frontend routes.

## Folder structure

```
src/
  config/db.js        Mongo connection
  models/              Mongoose schemas
  middleware/           auth (JWT), guest-id cookie, multer upload
  routes/               one file per API area (auth, catalog, cart, checkout, sellers,
                         seller portal, admin, uploads)
  seed/                 seed data ported from the frontend mock + seed script
  app.js / index.js    Express app wiring / entrypoint
```

## Claude integration (optional)

1. Add Claude credentials to your environment (see `.env.example`):

```
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_API_URL=https://api.anthropic.com/v1/complete
```

2. Start the server and call the proxy route from your frontend or a client:

```
POST /api/claude/generate
Content-Type: application/json

{ /* body forwarded to the configured CLAUDE_API_URL */ }
```

The server forwards whatever JSON you post directly to `CLAUDE_API_URL` with the
`Authorization: Bearer <CLAUDE_API_KEY>` header and returns the provider response.

