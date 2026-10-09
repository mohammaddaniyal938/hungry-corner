# API Reference

Base URL: `http://localhost:5000` · All bodies are JSON (restaurant/category/menu create & update also accept `multipart/form-data` with an `image` file when Cloudinary is configured).

> Generated from `scripts/generate-docs.js` — run `npm run docs` after changing endpoints.

## Conventions

**Auth** — send `Authorization: Bearer <accessToken>`. Tokens are invalidated by logout, password change, blocking, or role change.

**Roles** — `customer`, `restaurant_admin`, `admin` (super admin).

**Success**
```json
{ "success": true, "message": "Restaurant fetched successfully", "data": {} }
```
**Paginated** adds `"pagination": { "page": 1, "limit": 20, "total": 125, "totalPages": 7 }`

**Error**
```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "'email' must be a valid email" }] }
```

| Status | Meaning |
| --- | --- |
| 200 / 201 | OK / Created |
| 400 | Malformed id, bad JSON, business-rule violation (e.g. empty cart) |
| 401 | Missing, invalid or expired token; wrong credentials |
| 403 | Authenticated but not allowed (role, ownership, blocked account) |
| 404 | Resource not found (or hidden, e.g. inactive restaurant) |
| 409 | Conflict (duplicate, cart from another restaurant, item unavailable, invalid state) |
| 422 | Validation failed / invalid order status transition |
| 429 | Rate limit exceeded (auth endpoints) |

**Order status flow** `pending → confirmed → preparing → ready → out_for_delivery → delivered`; `pending` may also go to `rejected` or `cancelled`, `confirmed` to `cancelled`. Customers may cancel only while `pending` or `confirmed`.

## Auth

### Register (new customer)
`POST /api/auth/register` — Auth: none

Creates a customer account (role is always `customer`) and returns a JWT.

```json
{
  "name": "Postman User",
  "email": "{{newUserEmail}}",
  "password": "Password123!",
  "phone": "+923001234567"
}
```

### Register (duplicate email -> 409)
`POST /api/auth/register` — Auth: none

```json
{
  "name": "Postman User",
  "email": "{{newUserEmail}}",
  "password": "Password123!",
  "phone": "+923001234567"
}
```

### Register (invalid body -> 422)
`POST /api/auth/register` — Auth: none

```json
{
  "name": "x",
  "email": "nope",
  "password": "1"
}
```

### Login (customer)
`POST /api/auth/login` — Auth: none

Seeded customer. Returns `{ user, accessToken }`.

```json
{
  "email": "sara@example.com",
  "password": "Customer@123"
}
```

### Login (second customer)
`POST /api/auth/login` — Auth: none

```json
{
  "email": "usman@example.com",
  "password": "Customer@123"
}
```

### Login (restaurant admin)
`POST /api/auth/login` — Auth: none

```json
{
  "email": "owner1@karachibites.com",
  "password": "Restaurant@123"
}
```

### Login (super admin)
`POST /api/auth/login` — Auth: none

```json
{
  "email": "admin@karachibites.com",
  "password": "Admin@12345"
}
```

### Login (wrong password -> 401)
`POST /api/auth/login` — Auth: none

```json
{
  "email": "sara@example.com",
  "password": "Wrong123!"
}
```

### Get current user
`GET /api/users/me` — Auth: Bearer (customer)

### Get current user (no token -> 401)
`GET /api/users/me` — Auth: none

### Update profile
`PATCH /api/users/me` — Auth: Bearer (customer)

```json
{
  "name": "Sara Malik",
  "phone": "+923001111111"
}
```

### Change password (throwaway user)
`PATCH /api/users/change-password` — Auth: Bearer

Verifies the current password, hashes the new one, and invalidates all older tokens. Returns a fresh `accessToken`.

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

### Logout (throwaway user)
`POST /api/auth/logout` — Auth: Bearer

Invalidates every token issued to this user.

## Restaurants

### Create restaurant (restaurant admin)
`POST /api/restaurants` — Auth: Bearer (restaurant_admin / admin)

Restaurant admins create restaurants they own. Super admins must pass `owner` (a restaurant_admin user id). Accepts multipart/form-data with an `image` file when Cloudinary is configured.

```json
{
  "name": "Postman Kitchen",
  "description": "Created from Postman",
  "address": "1 Test Street",
  "city": "Karachi",
  "phone": "+923001234567",
  "openingTime": "10:00",
  "closingTime": "23:00",
  "deliveryFee": 150,
  "minimumOrder": 0
}
```

### Create restaurant (customer -> 403)
`POST /api/restaurants` — Auth: Bearer (customer)

```json
{
  "name": "Nope",
  "address": "1 St",
  "city": "Karachi"
}
```

### List restaurants (search, city, pagination)
`GET /api/restaurants` — Auth: none

Public. Query: `page`, `limit`, `search`, `city`, `isOpen`. Super admins may also pass `isActive=true|false|all`.

Query: `page=1&limit=10&search=pizza&city=Karachi`

### Get restaurant (with categories & menu)
`GET /api/restaurants/:restaurantId` — Auth: none

Public. Returns the restaurant with its categories, each carrying its `menuItems`.

### Update restaurant
`PATCH /api/restaurants/:restaurantId` — Auth: Bearer (restaurant_admin / admin)

Owner or super admin only. Only super admins can change `isActive`/`owner`.

```json
{
  "description": "Updated from Postman",
  "isOpen": true
}
```

### Update restaurant (other owner -> 403)
`PATCH /api/restaurants/:restaurantId` — Auth: Bearer (customer)

Customer token used here; any non-owner is refused.

```json
{
  "name": "Hijack"
}
```

### Get restaurant (invalid id -> 400)
`GET /api/restaurants/not-an-id` — Auth: none

## Categories

### Create category
`POST /api/restaurants/:restaurantId/categories` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "name": "Burgers",
  "description": "Our premium burgers",
  "sortOrder": 1
}
```

### Create category (duplicate -> 409)
`POST /api/restaurants/:restaurantId/categories` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "name": "burgers"
}
```

### List categories
`GET /api/restaurants/:restaurantId/categories` — Auth: none

### Get category
`GET /api/categories/:categoryId` — Auth: none

### Update category
`PATCH /api/categories/:categoryId` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "description": "Updated description"
}
```

## Menu

### Create menu item
`POST /api/restaurants/:restaurantId/menu` — Auth: Bearer (restaurant_admin / admin)

`discountPrice` must be lower than `price`; `category` must belong to this restaurant.

```json
{
  "category": "{{categoryId}}",
  "name": "Zinger Burger",
  "description": "Crispy chicken burger",
  "price": 650,
  "discountPrice": 599,
  "ingredients": [
    "Chicken",
    "Lettuce",
    "Cheese",
    "Sauce"
  ],
  "preparationTime": 15
}
```

### Create menu item (discount >= price -> 422)
`POST /api/restaurants/:restaurantId/menu` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "category": "{{categoryId}}",
  "name": "Bad",
  "price": 100,
  "discountPrice": 200
}
```

### Get menu (filters)
`GET /api/restaurants/:restaurantId/menu` — Auth: none

Public. Query: `category`, `search`, `minPrice`, `maxPrice`, `available`, `sort` (newest|price_asc|price_desc|name), `page`, `limit`. Price filters use the discounted price.

Query: `category={{categoryId}}&search=burger&minPrice=200&maxPrice=1000&page=1&limit=20`

### Get menu item
`GET /api/menu/:menuItemId` — Auth: none

### Update menu item
`PATCH /api/menu/:menuItemId` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "description": "Extra crispy",
  "preparationTime": 18
}
```

### Change availability (off)
`PATCH /api/menu/:menuItemId/availability` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "isAvailable": false
}
```

### Add unavailable item to cart -> 409
`POST /api/cart/items` — Auth: Bearer (customer)

```json
{
  "menuItemId": "{{menuItemId}}",
  "quantity": 1
}
```

### Change availability (on)
`PATCH /api/menu/:menuItemId/availability` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "isAvailable": true
}
```

## Cart

### Clear cart (reset)
`DELETE /api/cart` — Auth: Bearer (customer)

### Get cart (empty)
`GET /api/cart` — Auth: Bearer (customer)

### Add item
`POST /api/cart/items` — Auth: Bearer (customer)

Price always comes from the database. If the cart has another restaurant's items you get 409 unless `replaceCart: true`.

```json
{
  "menuItemId": "{{menuItemId}}",
  "quantity": 2
}
```

### Add item (quantity 0 -> 422)
`POST /api/cart/items` — Auth: Bearer (customer)

```json
{
  "menuItemId": "{{menuItemId}}",
  "quantity": 0
}
```

### Update quantity
`PATCH /api/cart/items/:menuItemId` — Auth: Bearer (customer)

```json
{
  "quantity": 3
}
```

### Get cart
`GET /api/cart` — Auth: Bearer (customer)

### Remove item
`DELETE /api/cart/items/:menuItemId` — Auth: Bearer (customer)

### Add item again (for checkout)
`POST /api/cart/items` — Auth: Bearer (customer)

```json
{
  "menuItemId": "{{menuItemId}}",
  "quantity": 2
}
```

## Orders

### Create order
`POST /api/orders` — Auth: Bearer (customer)

Totals are recalculated server-side from current database prices; anything the client sends for prices/totals is ignored. Optional `couponCode`. Clears the cart.

```json
{
  "deliveryAddress": {
    "address": "House 123, Main Street",
    "city": "Karachi",
    "postalCode": "75000"
  },
  "phone": "+923001234567",
  "paymentMethod": "cash",
  "notes": "Please call when outside"
}
```

### Create order (empty cart -> 400)
`POST /api/orders` — Auth: Bearer (customer)

```json
{
  "deliveryAddress": {
    "address": "House 123, Main Street",
    "city": "Karachi"
  },
  "phone": "+923001234567"
}
```

### My orders (pagination + status)
`GET /api/orders/my-orders` — Auth: Bearer (customer)

Query: `page=1&limit=10&status=pending`

### Get order
`GET /api/orders/:orderId` — Auth: Bearer (customer)

Customers: own orders. Restaurant admins: their restaurants' orders. Super admins: any.

### Get order (another customer -> 403)
`GET /api/orders/:orderId` — Auth: Bearer (customer)

### Cancel order
`PATCH /api/orders/:orderId/cancel` — Auth: Bearer (customer)

Allowed while `pending` or `confirmed`.

```json
{
  "reason": "Changed my mind"
}
```

### Cancel order again (-> 409)
`PATCH /api/orders/:orderId/cancel` — Auth: Bearer (customer)

### Place a second order (to fulfil)
`POST /api/orders` — Auth: Bearer (customer)

```json
{
  "deliveryAddress": {
    "address": "House 123, Main Street",
    "city": "Karachi"
  },
  "phone": "+923001234567"
}
```

## Restaurant Orders

### List restaurant orders
`GET /api/restaurants/:restaurantId/orders` — Auth: Bearer (restaurant_admin / admin)

Owner / super admin. Query: `status`, `from`, `to` (ISO dates), `search` (order number), `page`, `limit`.

Query: `status=pending&page=1&limit=20`

### List restaurant orders (customer -> 403)
`GET /api/restaurants/:restaurantId/orders` — Auth: Bearer (customer)

### Update status: skip ahead -> 422
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "status": "delivered"
}
```

### Update status: confirmed
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

Flow: pending → confirmed → preparing → ready → out_for_delivery → delivered (pending may also go to rejected/cancelled). Other transitions are refused with 422.

```json
{
  "status": "confirmed"
}
```

### Update status: preparing
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "status": "preparing"
}
```

### Update status: ready
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "status": "ready"
}
```

### Update status: out_for_delivery
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "status": "out_for_delivery"
}
```

### Update status: delivered
`PATCH /api/orders/:orderId/status` — Auth: Bearer (restaurant_admin / admin)

```json
{
  "status": "delivered"
}
```

### Update status (customer -> 403)
`PATCH /api/orders/:orderId/status` — Auth: Bearer (customer)

```json
{
  "status": "confirmed"
}
```

## Admin

### Dashboard statistics
`GET /api/admin/dashboard` — Auth: Bearer (admin)

Totals for users, restaurants, orders, revenue (delivered orders), today's/pending/completed orders.

### List users
`GET /api/admin/users` — Auth: Bearer (admin)

Query: `page=1&limit=20&role=customer`

### Block user
`PATCH /api/admin/users/:targetUserId/block` — Auth: Bearer (admin)

Blocked users are signed out immediately and cannot log in.

### Unblock user
`PATCH /api/admin/users/:targetUserId/unblock` — Auth: Bearer (admin)

### List restaurants (incl. inactive)
`GET /api/admin/restaurants` — Auth: Bearer (admin)

Query: `page=1&limit=20`

### Deactivate restaurant
`PATCH /api/admin/restaurants/:restaurantId/status` — Auth: Bearer (admin)

```json
{
  "isActive": false
}
```

### Activate restaurant
`PATCH /api/admin/restaurants/:restaurantId/status` — Auth: Bearer (admin)

```json
{
  "isActive": true
}
```

### List all orders
`GET /api/admin/orders` — Auth: Bearer (admin)

Query: `page=1&limit=20`

### Create coupon
`POST /api/admin/coupons` — Auth: Bearer (admin)

```json
{
  "code": "{{couponCode}}",
  "discountType": "percentage",
  "discountValue": 10,
  "minimumOrder": 500,
  "maximumDiscount": 300,
  "expiryDate": "2999-01-01T00:00:00.000Z",
  "usageLimit": 100
}
```

### List coupons
`GET /api/admin/coupons` — Auth: Bearer (admin)

### Customer cannot access admin routes (403)
`GET /api/admin/dashboard` — Auth: Bearer (customer)

### Restaurant admin cannot access admin routes (403)
`GET /api/admin/users` — Auth: Bearer (restaurant_admin / admin)

## Cleanup

### Delete menu item
`DELETE /api/menu/:menuItemId` — Auth: Bearer (restaurant_admin / admin)

### Delete category
`DELETE /api/categories/:categoryId` — Auth: Bearer (restaurant_admin / admin)

### Delete coupon
`DELETE /api/admin/coupons/:couponId` — Auth: Bearer (admin)

### Deactivate restaurant (soft delete, super admin)
`DELETE /api/restaurants/:restaurantId` — Auth: Bearer (admin)

Soft delete: sets `isActive=false`; data is preserved.

### Deactivate restaurant (restaurant admin -> 403)
`DELETE /api/restaurants/:restaurantId` — Auth: Bearer (restaurant_admin / admin)

