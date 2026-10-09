# Restaurant Backend API

Express + MongoDB (Mongoose) REST API for the Karachi Bites restaurant app: authentication, role-based access,
restaurants, categories, menu, cart, orders, and admin tools. It lives in `backend/` next to the existing front-end
and does not touch it.

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET (and MONGODB_URI if not local)
npm run seed                # sample users, 3 restaurants, categories, menu items, coupons
npm run dev                 # http://localhost:5000   (npm start for production)
```

Requires Node 18+ and a running MongoDB (local or Atlas).

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Port (default 5000) |
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | **Required.** Long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed browser origin(s), comma-separated (CORS) |
| `CLOUDINARY_*` | Optional. Enables `image` file uploads on multipart requests |

`.env` is git-ignored; only `.env.example` is committed.

### Seed accounts (`npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@karachibites.com` | `Admin@12345` |
| Restaurant admin | `owner1@karachibites.com` (Karachi Bites, Desi Dhaba) | `Restaurant@123` |
| Restaurant admin | `owner2@karachibites.com` (Pizza Palace) | `Restaurant@123` |
| Customers | `sara@example.com`, `usman@example.com`, `hina@example.com` | `Customer@123` |

Coupons: `WELCOME10` (10 %, max 300, min order 500), `FLAT200` (200 off, min order 1500).
The Karachi Bites menu is built from the products already in `src/data/products.js`. The seed **wipes** the
collections it touches and refuses to run with `NODE_ENV=production` unless `--force` is passed.

## Testing

```bash
npm test                                   # starts an in-memory MongoDB (downloads a binary on first run)
TEST_MONGODB_URI=mongodb://localhost:27017 npm test   # or use your own server (a throw-away DB is created and dropped)
```

`tests/api.test.js` covers auth, token revocation, RBAC and ownership, validation, CRUD, menu filters, cart edge cases
(price drift, deleted/unavailable items, other-restaurant items), checkout, coupons, order cancellation and status
transitions, and the admin endpoints.

**Postman:** import `postman/restaurant-api.postman_collection.json` and run it top to bottom (seed first). Tokens
and ids are captured into collection variables automatically; it includes the 401/403/409/422 negative cases.
CLI: `npx newman run postman/restaurant-api.postman_collection.json`.

**Docs:** `docs/API.md` (generated; `npm run docs` regenerates both it and the Postman collection from one source).

## Design notes

- **Roles:** `customer`, `restaurant_admin`, `admin` (= super admin). Public registration always creates customers;
  role changes happen only through `PATCH /api/admin/users/:id/role`.
- **Ownership:** a restaurant admin can manage only restaurants where `owner` is them. Category/menu/order access is
  resolved through the parent restaurant (`services/access.service.js`). One admin may own several restaurants (the
  spec seeds 3 restaurants with 2 admins).
- **Sessions:** JWTs carry a token version. Logout, password change, blocking and role changes bump it, instantly
  invalidating older tokens. Password change returns a fresh token.
- **Prices:** never trusted from the client. `finalPrice` (discount or price) is stored on the menu item; the cart
  re-reads prices on every fetch (reporting `warnings` for price changes / removed / unavailable items) and checkout
  recomputes everything from the database. Orders store a name/price snapshot.
- **Checkout safety:** the cart is claimed with a conditional `findOneAndDelete` so a double submit cannot create two
  orders; coupon usage is a single conditional `$inc`; status changes and cancellation are conditional updates so they
  cannot race each other. Order creation does not use multi-document transactions, so it runs on a standalone MongoDB;
  on failure the cart and coupon use are restored best-effort.
- **Deletes:** restaurants are soft-deleted (`isActive=false`; hidden from the public, kept for order history).
  Menu items are hard-deleted (orders keep snapshots; carts self-heal). A category with items returns 409; deactivate
  it instead.
- **Security:** helmet, CORS allow-list, bcrypt (12 rounds), Joi validation (unknown fields stripped, 422),
  ObjectId validation (400), Mongo-operator stripping, regex-escaped search, rate limiting on register/login,
  generic login errors (no user enumeration), 1 MB body limit.
- **Coupons** (`/api/admin/coupons`, `couponCode` on `POST /api/orders`) were added from the spec's optional list.
- "Today" in the dashboard uses the server's local midnight.

## Not implemented

Optional extras from the spec that are **not** included: reviews, favorites, saved delivery addresses,
notifications. Cloudinary upload code is written but was not exercised against a real Cloudinary account.
The existing front-end still uses Supabase; it has not been switched over to this API.

## Layout

```
src/ config/ controllers/ middleware/ models/ routes/ seed/ services/ utils/ validators/  app.js server.js
tests/  postman/  docs/  scripts/
```
