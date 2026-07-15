# Falsafah Tot API

Real Node.js/Express + MongoDB backend for the Falsafah Tot marketplace, built to the same
contract as the frontend's mock API (`src/lib/api.js` / `src/mocks/*`). The frontend still runs
against MSW for now — this server is standalone until it's wired in.

## Setup

```bash
cd server
npm install
cp .env.example .env   # adjust if your Mongo URI/JWT secret differ
npm run seed            # populates categories, products, sellers, and 3 demo accounts
npm run dev              # http://localhost:5000
```

Requires a MongoDB instance reachable at `MONGODB_URI` (defaults to
`mongodb://localhost:27017/falsafahtot`).

### Demo accounts (password: `password123`)

- `buyer@falsafahtot.com` — buyer
- `seller@falsafahtot.com` — seller, KYC pre-approved
- `admin@falsafahtot.com` — admin

## Design notes / current limitations

- **OTP is fixed to `123456`** for every signin/signup/forgot-password flow (see
  `src/utils/token.js`). Swap `DEV_OTP_CODE` for a real emailed code (e.g. via Resend) later —
  the `PendingAuth` model already has the shape (`otp`, 15-minute TTL) for that.
- **Auth is JWT-based and stateless.** `POST /api/auth/logout` just tells the client to discard
  its token; there's no server-side revoke list yet.
- **Cart and store-follows are guest-scoped**, not tied to login — matches the current frontend,
  which never sends an auth token to `/api/cart` or `/api/sellers/:id/follow`. Identity is an
  httpOnly `guestId` cookie set on first request. Once the frontend switches from `fetch(...)` to
  requests with `credentials: 'include'`, this will keep working unchanged.
- **Uploads are local disk**, served from `/uploads/*`. `POST /api/uploads/:type` (`cnic` |
  `business-docs` | `products`, multipart field `file`) returns `{ url }`; that URL is what you
  pass as `cnicFront`/`cnicBack`/`businessDocument`/`images[]` on the other endpoints — same
  shape the mock already validates ("images must be a list of URLs").
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
