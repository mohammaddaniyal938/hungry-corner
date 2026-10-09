/* eslint-disable no-console */
// Generates postman/restaurant-api.postman_collection.json and docs/API.md from ONE endpoint list,
// so the collection and the documentation cannot drift apart.   Usage: npm run docs
const fs = require('fs');
const path = require('path');

const T = (s) => s.trim().split('\n').map((l) => l.trim());
const status = (code) => `pm.test('Status is ${code}', () => pm.response.to.have.status(${code}));`;
const save = (v, expr) => `pm.collectionVariables.set('${v}', ${expr});`;
const json = 'const j = pm.response.json();';

// auth: null | customer | owner | admin | customer2   (tokens are collection variables)
const E = [];
const add = (folder, name, method, url, o = {}) => E.push({ folder, name, method, url, ...o });

// ---------------------------------------------------------------- Auth
add('Auth', 'Register (new customer)', 'POST', '/api/auth/register', {
  desc: 'Creates a customer account (role is always `customer`) and returns a JWT.',
  body: { name: 'Postman User', email: '{{newUserEmail}}', password: 'Password123!', phone: '+923001234567' },
  pre: "pm.collectionVariables.set('newUserEmail', 'pm_' + Date.now() + '@example.com');",
  test: [status(201), json, 'pm.expect(j.data.user.role).to.eql("customer");', 'pm.expect(JSON.stringify(j)).to.not.include("password");', save('newUserToken', 'j.data.accessToken')],
});
add('Auth', 'Register (duplicate email -> 409)', 'POST', '/api/auth/register', {
  body: { name: 'Postman User', email: '{{newUserEmail}}', password: 'Password123!', phone: '+923001234567' }, test: [status(409)],
});
add('Auth', 'Register (invalid body -> 422)', 'POST', '/api/auth/register', { body: { name: 'x', email: 'nope', password: '1' }, test: [status(422)] });
add('Auth', 'Login (customer)', 'POST', '/api/auth/login', {
  desc: 'Seeded customer. Returns `{ user, accessToken }`.',
  body: { email: 'sara@example.com', password: 'Customer@123' }, test: [status(200), json, save('customerToken', 'j.data.accessToken')],
});
add('Auth', 'Login (second customer)', 'POST', '/api/auth/login', {
  body: { email: 'usman@example.com', password: 'Customer@123' }, test: [status(200), json, save('customer2Token', 'j.data.accessToken')],
});
add('Auth', 'Login (restaurant admin)', 'POST', '/api/auth/login', {
  body: { email: 'owner1@karachibites.com', password: 'Restaurant@123' }, test: [status(200), json, save('ownerToken', 'j.data.accessToken'), save('ownerId', 'j.data.user.id')],
});
add('Auth', 'Login (super admin)', 'POST', '/api/auth/login', {
  body: { email: 'admin@karachibites.com', password: 'Admin@12345' }, test: [status(200), json, save('adminToken', 'j.data.accessToken')],
});
add('Auth', 'Login (wrong password -> 401)', 'POST', '/api/auth/login', { body: { email: 'sara@example.com', password: 'Wrong123!' }, test: [status(401)] });
add('Auth', 'Get current user', 'GET', '/api/users/me', { auth: 'customer', test: [status(200), json, 'pm.expect(j.data.email).to.eql("sara@example.com");'] });
add('Auth', 'Get current user (no token -> 401)', 'GET', '/api/users/me', { test: [status(401)] });
add('Auth', 'Update profile', 'PATCH', '/api/users/me', { auth: 'customer', body: { name: 'Sara Malik', phone: '+923001111111' }, test: [status(200)] });
add('Auth', 'Change password (throwaway user)', 'PATCH', '/api/users/change-password', {
  desc: 'Verifies the current password, hashes the new one, and invalidates all older tokens. Returns a fresh `accessToken`.',
  auth: 'newUser', body: { currentPassword: 'Password123!', newPassword: 'NewPassword123!' }, test: [status(200), json, save('newUserToken', 'j.data.accessToken')],
});
add('Auth', 'Logout (throwaway user)', 'POST', '/api/auth/logout', { auth: 'newUser', desc: 'Invalidates every token issued to this user.', test: [status(200)] });

// ---------------------------------------------------------------- Restaurants
add('Restaurants', 'Create restaurant (restaurant admin)', 'POST', '/api/restaurants', {
  desc: 'Restaurant admins create restaurants they own. Super admins must pass `owner` (a restaurant_admin user id). Accepts multipart/form-data with an `image` file when Cloudinary is configured.',
  auth: 'owner', body: { name: 'Postman Kitchen', description: 'Created from Postman', address: '1 Test Street', city: 'Karachi', phone: '+923001234567', openingTime: '10:00', closingTime: '23:00', deliveryFee: 150, minimumOrder: 0 },
  test: [status(201), json, save('restaurantId', 'j.data.id')],
});
add('Restaurants', 'Create restaurant (customer -> 403)', 'POST', '/api/restaurants', { auth: 'customer', body: { name: 'Nope', address: '1 St', city: 'Karachi' }, test: [status(403)] });
add('Restaurants', 'List restaurants (search, city, pagination)', 'GET', '/api/restaurants', {
  desc: 'Public. Query: `page`, `limit`, `search`, `city`, `isOpen`. Super admins may also pass `isActive=true|false|all`.',
  query: { page: 1, limit: 10, search: 'pizza', city: 'Karachi' }, test: [status(200), json, 'pm.expect(j.pagination).to.have.keys(["page","limit","total","totalPages"]);'],
});
add('Restaurants', 'Get restaurant (with categories & menu)', 'GET', '/api/restaurants/{{restaurantId}}', { desc: 'Public. Returns the restaurant with its categories, each carrying its `menuItems`.', test: [status(200)] });
add('Restaurants', 'Update restaurant', 'PATCH', '/api/restaurants/{{restaurantId}}', { desc: 'Owner or super admin only. Only super admins can change `isActive`/`owner`.', auth: 'owner', body: { description: 'Updated from Postman', isOpen: true }, test: [status(200)] });
add('Restaurants', 'Update restaurant (other owner -> 403)', 'PATCH', '/api/restaurants/{{restaurantId}}', { desc: 'Customer token used here; any non-owner is refused.', auth: 'customer', body: { name: 'Hijack' }, test: [status(403)] });
add('Restaurants', 'Get restaurant (invalid id -> 400)', 'GET', '/api/restaurants/not-an-id', { test: [status(400)] });

// ---------------------------------------------------------------- Categories
add('Categories', 'Create category', 'POST', '/api/restaurants/{{restaurantId}}/categories', {
  auth: 'owner', body: { name: 'Burgers', description: 'Our premium burgers', sortOrder: 1 }, test: [status(201), json, save('categoryId', 'j.data.id')],
});
add('Categories', 'Create category (duplicate -> 409)', 'POST', '/api/restaurants/{{restaurantId}}/categories', { auth: 'owner', body: { name: 'burgers' }, test: [status(409)] });
add('Categories', 'List categories', 'GET', '/api/restaurants/{{restaurantId}}/categories', { test: [status(200), json, 'pm.expect(j.data.length).to.be.above(0);'] });
add('Categories', 'Get category', 'GET', '/api/categories/{{categoryId}}', { test: [status(200)] });
add('Categories', 'Update category', 'PATCH', '/api/categories/{{categoryId}}', { auth: 'owner', body: { description: 'Updated description' }, test: [status(200)] });

// ---------------------------------------------------------------- Menu
add('Menu', 'Create menu item', 'POST', '/api/restaurants/{{restaurantId}}/menu', {
  desc: '`discountPrice` must be lower than `price`; `category` must belong to this restaurant.',
  auth: 'owner', body: { category: '{{categoryId}}', name: 'Zinger Burger', description: 'Crispy chicken burger', price: 650, discountPrice: 599, ingredients: ['Chicken', 'Lettuce', 'Cheese', 'Sauce'], preparationTime: 15 },
  test: [status(201), json, 'pm.expect(j.data.finalPrice).to.eql(599);', save('menuItemId', 'j.data.id')],
});
add('Menu', 'Create menu item (discount >= price -> 422)', 'POST', '/api/restaurants/{{restaurantId}}/menu', { auth: 'owner', body: { category: '{{categoryId}}', name: 'Bad', price: 100, discountPrice: 200 }, test: [status(422)] });
add('Menu', 'Get menu (filters)', 'GET', '/api/restaurants/{{restaurantId}}/menu', {
  desc: 'Public. Query: `category`, `search`, `minPrice`, `maxPrice`, `available`, `sort` (newest|price_asc|price_desc|name), `page`, `limit`. Price filters use the discounted price.',
  query: { category: '{{categoryId}}', search: 'burger', minPrice: 200, maxPrice: 1000, page: 1, limit: 20 }, test: [status(200), json, 'pm.expect(j.data.length).to.be.above(0);'],
});
add('Menu', 'Get menu item', 'GET', '/api/menu/{{menuItemId}}', { test: [status(200)] });
add('Menu', 'Update menu item', 'PATCH', '/api/menu/{{menuItemId}}', { auth: 'owner', body: { description: 'Extra crispy', preparationTime: 18 }, test: [status(200)] });
add('Menu', 'Change availability (off)', 'PATCH', '/api/menu/{{menuItemId}}/availability', { auth: 'owner', body: { isAvailable: false }, test: [status(200), json, 'pm.expect(j.data.isAvailable).to.eql(false);'] });
add('Menu', 'Add unavailable item to cart -> 409', 'POST', '/api/cart/items', { auth: 'customer', body: { menuItemId: '{{menuItemId}}', quantity: 1 }, test: [status(409)] });
add('Menu', 'Change availability (on)', 'PATCH', '/api/menu/{{menuItemId}}/availability', { auth: 'owner', body: { isAvailable: true }, test: [status(200)] });

// ---------------------------------------------------------------- Cart
add('Cart', 'Clear cart (reset)', 'DELETE', '/api/cart', { auth: 'customer', test: [status(200)] });
add('Cart', 'Get cart (empty)', 'GET', '/api/cart', { auth: 'customer', test: [status(200), json, 'pm.expect(j.data.items).to.have.length(0);'] });
add('Cart', 'Add item', 'POST', '/api/cart/items', {
  desc: 'Price always comes from the database. If the cart has another restaurant\'s items you get 409 unless `replaceCart: true`.',
  auth: 'customer', body: { menuItemId: '{{menuItemId}}', quantity: 2 }, test: [status(201), json, 'pm.expect(j.data.items[0].price).to.eql(599);', 'pm.expect(j.data.subtotal).to.eql(1198);'],
});
add('Cart', 'Add item (quantity 0 -> 422)', 'POST', '/api/cart/items', { auth: 'customer', body: { menuItemId: '{{menuItemId}}', quantity: 0 }, test: [status(422)] });
add('Cart', 'Update quantity', 'PATCH', '/api/cart/items/{{menuItemId}}', { auth: 'customer', body: { quantity: 3 }, test: [status(200), json, 'pm.expect(j.data.items[0].quantity).to.eql(3);'] });
add('Cart', 'Get cart', 'GET', '/api/cart', { auth: 'customer', test: [status(200), json, 'pm.expect(j.data.total).to.eql(599*3 + 150);'] });
add('Cart', 'Remove item', 'DELETE', '/api/cart/items/{{menuItemId}}', { auth: 'customer', test: [status(200)] });
add('Cart', 'Add item again (for checkout)', 'POST', '/api/cart/items', { auth: 'customer', body: { menuItemId: '{{menuItemId}}', quantity: 2 }, test: [status(201)] });

// ---------------------------------------------------------------- Orders
add('Orders', 'Create order', 'POST', '/api/orders', {
  desc: 'Totals are recalculated server-side from current database prices; anything the client sends for prices/totals is ignored. Optional `couponCode`. Clears the cart.',
  auth: 'customer', body: { deliveryAddress: { address: 'House 123, Main Street', city: 'Karachi', postalCode: '75000' }, phone: '+923001234567', paymentMethod: 'cash', notes: 'Please call when outside' },
  test: [status(201), json, 'pm.expect(j.data.orderStatus).to.eql("pending");', 'pm.expect(j.data.total).to.eql(599*2 + 150);', save('orderId', 'j.data.id'), save('orderNumber', 'j.data.orderNumber')],
});
add('Orders', 'Create order (empty cart -> 400)', 'POST', '/api/orders', { auth: 'customer', body: { deliveryAddress: { address: 'House 123, Main Street', city: 'Karachi' }, phone: '+923001234567' }, test: [status(400)] });
add('Orders', 'My orders (pagination + status)', 'GET', '/api/orders/my-orders', { auth: 'customer', query: { page: 1, limit: 10, status: 'pending' }, test: [status(200), json, 'pm.expect(j.data.length).to.be.above(0);'] });
add('Orders', 'Get order', 'GET', '/api/orders/{{orderId}}', { desc: 'Customers: own orders. Restaurant admins: their restaurants\' orders. Super admins: any.', auth: 'customer', test: [status(200)] });
add('Orders', 'Get order (another customer -> 403)', 'GET', '/api/orders/{{orderId}}', { auth: 'customer2', test: [status(403)] });
add('Orders', 'Cancel order', 'PATCH', '/api/orders/{{orderId}}/cancel', { desc: 'Allowed while `pending` or `confirmed`.', auth: 'customer', body: { reason: 'Changed my mind' }, test: [status(200), json, 'pm.expect(j.data.orderStatus).to.eql("cancelled");'] });
add('Orders', 'Cancel order again (-> 409)', 'PATCH', '/api/orders/{{orderId}}/cancel', { auth: 'customer', test: [status(409)] });
add('Orders', 'Place a second order (to fulfil)', 'POST', '/api/orders', {
  auth: 'customer', pre: null, body: { deliveryAddress: { address: 'House 123, Main Street', city: 'Karachi' }, phone: '+923001234567' },
  test: [status(201), save('orderId', 'pm.response.json().data.id')], setup: 'cart',
});

// ---------------------------------------------------------------- Restaurant orders
add('Restaurant Orders', 'List restaurant orders', 'GET', '/api/restaurants/{{restaurantId}}/orders', {
  desc: 'Owner / super admin. Query: `status`, `from`, `to` (ISO dates), `search` (order number), `page`, `limit`.',
  auth: 'owner', query: { status: 'pending', page: 1, limit: 20 }, test: [status(200), json, 'pm.expect(j.data.length).to.be.above(0);'],
});
add('Restaurant Orders', 'List restaurant orders (customer -> 403)', 'GET', '/api/restaurants/{{restaurantId}}/orders', { auth: 'customer', test: [status(403)] });
add('Restaurant Orders', 'Update status: skip ahead -> 422', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'owner', body: { status: 'delivered' }, test: [status(422)] });
add('Restaurant Orders', 'Update status: confirmed', 'PATCH', '/api/orders/{{orderId}}/status', {
  desc: 'Flow: pending → confirmed → preparing → ready → out_for_delivery → delivered (pending may also go to rejected/cancelled). Other transitions are refused with 422.',
  auth: 'owner', body: { status: 'confirmed' }, test: [status(200)],
});
add('Restaurant Orders', 'Update status: preparing', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'owner', body: { status: 'preparing' }, test: [status(200)] });
add('Restaurant Orders', 'Update status: ready', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'owner', body: { status: 'ready' }, test: [status(200)] });
add('Restaurant Orders', 'Update status: out_for_delivery', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'owner', body: { status: 'out_for_delivery' }, test: [status(200)] });
add('Restaurant Orders', 'Update status: delivered', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'owner', body: { status: 'delivered' }, test: [status(200), json, 'pm.expect(j.data.paymentStatus).to.eql("paid");'] });
add('Restaurant Orders', 'Update status (customer -> 403)', 'PATCH', '/api/orders/{{orderId}}/status', { auth: 'customer', body: { status: 'confirmed' }, test: [status(403)] });

// ---------------------------------------------------------------- Admin
add('Admin', 'Dashboard statistics', 'GET', '/api/admin/dashboard', { desc: 'Totals for users, restaurants, orders, revenue (delivered orders), today\'s/pending/completed orders.', auth: 'admin', test: [status(200), json, 'pm.expect(j.data).to.include.keys(["totalUsers","totalRestaurants","totalOrders","totalRevenue","todaysOrders","pendingOrders","completedOrders"]);'] });
add('Admin', 'List users', 'GET', '/api/admin/users', { auth: 'admin', query: { page: 1, limit: 20, role: 'customer' }, test: [status(200), json, save('targetUserId', 'j.data[0].id')] });
add('Admin', 'Block user', 'PATCH', '/api/admin/users/{{targetUserId}}/block', { desc: 'Blocked users are signed out immediately and cannot log in.', auth: 'admin', test: [status(200)] });
add('Admin', 'Unblock user', 'PATCH', '/api/admin/users/{{targetUserId}}/unblock', { auth: 'admin', test: [status(200)] });
add('Admin', 'List restaurants (incl. inactive)', 'GET', '/api/admin/restaurants', { auth: 'admin', query: { page: 1, limit: 20 }, test: [status(200)] });
add('Admin', 'Deactivate restaurant', 'PATCH', '/api/admin/restaurants/{{restaurantId}}/status', { auth: 'admin', body: { isActive: false }, test: [status(200)] });
add('Admin', 'Activate restaurant', 'PATCH', '/api/admin/restaurants/{{restaurantId}}/status', { auth: 'admin', body: { isActive: true }, test: [status(200)] });
add('Admin', 'List all orders', 'GET', '/api/admin/orders', { auth: 'admin', query: { page: 1, limit: 20 }, test: [status(200)] });
add('Admin', 'Create coupon', 'POST', '/api/admin/coupons', {
  auth: 'admin', pre: "pm.collectionVariables.set('couponCode', 'PM' + Date.now());",
  body: { code: '{{couponCode}}', discountType: 'percentage', discountValue: 10, minimumOrder: 500, maximumDiscount: 300, expiryDate: '2999-01-01T00:00:00.000Z', usageLimit: 100 }, test: [status(201), json, save('couponId', 'j.data.id')],
});
add('Admin', 'List coupons', 'GET', '/api/admin/coupons', { auth: 'admin', test: [status(200)] });
add('Admin', 'Customer cannot access admin routes (403)', 'GET', '/api/admin/dashboard', { auth: 'customer', test: [status(403)] });
add('Admin', 'Restaurant admin cannot access admin routes (403)', 'GET', '/api/admin/users', { auth: 'owner', test: [status(403)] });

// ---------------------------------------------------------------- Cleanup
add('Cleanup', 'Delete menu item', 'DELETE', '/api/menu/{{menuItemId}}', { auth: 'owner', test: [status(200)] });
add('Cleanup', 'Delete category', 'DELETE', '/api/categories/{{categoryId}}', { auth: 'owner', test: [status(200)] });
add('Cleanup', 'Delete coupon', 'DELETE', '/api/admin/coupons/{{couponId}}', { auth: 'admin', test: [status(200)] });
add('Cleanup', 'Deactivate restaurant (soft delete, super admin)', 'DELETE', '/api/restaurants/{{restaurantId}}', { desc: 'Soft delete: sets `isActive=false`; data is preserved.', auth: 'admin', test: [status(200), json, 'pm.expect(j.data.isActive).to.eql(false);'] });
add('Cleanup', 'Deactivate restaurant (restaurant admin -> 403)', 'DELETE', '/api/restaurants/{{restaurantId}}', { auth: 'owner', test: [status(403)] });

// ---------------------------------------------------------------- Postman output
const tokenVar = { customer2: 'customer2Token', customer: 'customerToken', owner: 'ownerToken', admin: 'adminToken', newUser: 'newUserToken' };
const toRequest = (e) => {
  const [p, qs] = e.url.split('?');
  const item = {
    name: e.name,
    request: {
      method: e.method,
      header: [...(e.body ? [{ key: 'Content-Type', value: 'application/json' }] : [])],
      url: {
        raw: `{{baseUrl}}${p}`, host: ['{{baseUrl}}'], path: p.split('/').filter(Boolean),
        ...(e.query && { query: Object.entries(e.query).map(([key, value]) => ({ key, value: String(value) })) }),
      },
      ...(e.body && { body: { mode: 'raw', raw: JSON.stringify(e.body, null, 2), options: { raw: { language: 'json' } } } }),
      description: e.desc || '',
    },
    event: [],
  };
  if (e.query) item.request.url.raw += `?${Object.entries(e.query).map(([k, v]) => `${k}=${v}`).join('&')}`;
  if (e.auth) item.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: `{{${tokenVar[e.auth]}}}`, type: 'string' }] };
  else item.request.auth = { type: 'noauth' };
  if (e.pre) item.event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: [e.pre] } });
  item.event.push({ listen: 'test', script: { type: 'text/javascript', exec: e.test } });
  void qs;
  return item;
};

const folders = [...new Set(E.map((e) => e.folder))];
const collection = {
  info: {
    name: 'Restaurant Backend API',
    description: 'Run the folders top to bottom (Collection Runner / newman). Requires `npm run seed` first. Tokens and ids are stored in collection variables automatically.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000' },
    ...['customerToken', 'customer2Token', 'ownerToken', 'adminToken', 'newUserToken', 'newUserEmail', 'restaurantId', 'categoryId', 'menuItemId', 'orderId', 'orderNumber', 'targetUserId', 'couponId', 'couponCode', 'ownerId'].map((key) => ({ key, value: '' })),
  ],
  item: folders.map((f) => ({ name: f, item: E.filter((e) => e.folder === f).map(toRequest) })),
};

// The second order needs items in the cart; inject a cart refill request before it.
const orders = collection.item.find((f) => f.name === 'Orders');
const idx = orders.item.findIndex((i) => i.name === 'Place a second order (to fulfil)');
orders.item.splice(idx, 0, toRequest({
  folder: 'Orders', name: 'Add item (for second order)', method: 'POST', url: '/api/cart/items', auth: 'customer',
  body: { menuItemId: '{{menuItemId}}', quantity: 1 }, test: [status(201)],
}));

fs.mkdirSync(path.join(__dirname, '../postman'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../postman/restaurant-api.postman_collection.json'), JSON.stringify(collection, null, 2));

// ---------------------------------------------------------------- Markdown docs
const authLabel = { customer2: 'Bearer (customer)', customer: 'Bearer (customer)', owner: 'Bearer (restaurant_admin / admin)', admin: 'Bearer (admin)', newUser: 'Bearer' };
let md = `# API Reference

Base URL: \`http://localhost:5000\` · All bodies are JSON (restaurant/category/menu create & update also accept \`multipart/form-data\` with an \`image\` file when Cloudinary is configured).

> Generated from \`scripts/generate-docs.js\` — run \`npm run docs\` after changing endpoints.

## Conventions

**Auth** — send \`Authorization: Bearer <accessToken>\`. Tokens are invalidated by logout, password change, blocking, or role change.

**Roles** — \`customer\`, \`restaurant_admin\`, \`admin\` (super admin).

**Success**
\`\`\`json
{ "success": true, "message": "Restaurant fetched successfully", "data": {} }
\`\`\`
**Paginated** adds \`"pagination": { "page": 1, "limit": 20, "total": 125, "totalPages": 7 }\`

**Error**
\`\`\`json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "'email' must be a valid email" }] }
\`\`\`

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

**Order status flow** \`pending → confirmed → preparing → ready → out_for_delivery → delivered\`; \`pending\` may also go to \`rejected\` or \`cancelled\`, \`confirmed\` to \`cancelled\`. Customers may cancel only while \`pending\` or \`confirmed\`.

`;
for (const f of folders) {
  md += `## ${f}\n\n`;
  for (const e of E.filter((x) => x.folder === f)) {
    md += `### ${e.name}\n\`${e.method} ${e.url.replace(/\{\{(\w+)\}\}/g, ':$1')}\` — Auth: ${e.auth ? authLabel[e.auth] : 'none'}\n\n`;
    if (e.desc) md += `${e.desc}\n\n`;
    if (e.query) md += `Query: \`${Object.entries(e.query).map(([k, v]) => `${k}=${v}`).join('&')}\`\n\n`;
    if (e.body) md += `\`\`\`json\n${JSON.stringify(e.body, null, 2)}\n\`\`\`\n\n`;
  }
}
fs.writeFileSync(path.join(__dirname, '../docs/API.md'), md);
console.log(`Generated ${E.length + 1} requests in ${folders.length} folders.`);
