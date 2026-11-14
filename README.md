# FreshBox

FreshBox is a MERN fresh-produce ordering and operations platform based on
[FreshBox_README.md](./FreshBox_README.md). It includes a responsive storefront,
customer accounts, product and box catalogues, cart and checkout, order tracking,
subscriptions, and an operations dashboard.

## Technology

- React, Vite, React Router
- Node.js, Express, Mongoose, MongoDB
- Zod request validation, bcrypt password hashing, short-lived JWT access
  tokens, rotating HttpOnly refresh cookies

## Run locally

Requirements: Node.js LTS, npm, and MongoDB local or Atlas.

1. Install all workspace dependencies:

   ```powershell
   npm install
   ```

2. Create the backend environment file:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   Set `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in
   `server/.env`. Use two different, randomly generated secrets. Set
   `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` (at least 12
   characters) to create the first administrator. If that email already has
   an account, the seed script promotes it only when the configured password
   matches that account.

3. Add development catalogue and delivery data, and create the administrator:

   ```powershell
   npm run seed -w server
   ```

   The seed is safe to rerun: existing products, packages, areas, and slots are
   not overwritten. Its Colombo delivery area and sample delivery slots are
   development data; replace them with approved business settings.

4. Start the frontend and API together:

   ```powershell
   npm run dev
   ```

   The storefront runs at `http://localhost:5173`, and the API at
   `http://localhost:5000`. Override `CLIENT_URL` and `PORT` as needed.

For a separate frontend API URL, copy `client/.env.example` to `client/.env`
and set `VITE_API_BASE_URL`.

## Useful commands

```powershell
npm run dev
npm run build
npm run start
npm run seed -w server
```

## Implementation notes

- All catalogue pricing and checkout totals are recalculated by the API.
  Products and products included in a box are stock-checked and reserved at
  order placement; cancelled orders release their stock.
- Product and order administration, inventory adjustments, delivery areas and
  slots, coupons, suppliers, subscriptions, customer support, reviews, and
  reports use authenticated API routes with backend role checks.
- Administrators can upload JPEG, PNG, or WebP product photos (up to 5 MB),
  edit catalogue details, and archive or restore products. Uploaded photos are
  stored in `server/uploads`; use persistent storage and backups for deployments.
- Checkout currently supports Cash on Delivery. An online payment gateway,
  signed payment webhooks, transactional email/SMS, and cloud image storage
  require a business-selected provider and credentials; no provider secrets or
  fake payment success behavior are included.
- Subscription records and customer controls are implemented; recurring order
  scheduling/charging requires the business to confirm the scheduling,
  cancellation, and payment policies before enabling automated jobs.
- The contact and newsletter forms are presentation-only. Configure an email
  provider before using them to collect messages.
- This is a working foundation, not a production-complete implementation of
  every README item. Password recovery, wishlists, a visual custom-box builder,
  in-app notification screens, and automated subscription order jobs still need
  implementation and policy decisions.
- Before production, replace sample delivery configuration and policies, add
  approved privacy/terms copy, configure HTTPS and monitoring, and run security
  and end-to-end testing against a production-like MongoDB deployment.

## API

The REST API is under `/api`. Check `GET /api/health` for service status.
Public catalogue endpoints include `/products`, `/products/:id`,
`/categories`, `/packages`, `/delivery/areas`, and `/delivery/slots`.
Authenticated customer endpoints include `/auth`, `/users/me`, `/cart`,
`/orders`, `/subscriptions`, `/notifications`, `/reviews`, and `/support`.
Operations endpoints are under `/admin` and enforce server-side roles.