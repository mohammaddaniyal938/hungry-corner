const { connect, disconnect, api, register, createStaff, auth } = require('./setup');

let admin; let owner; let owner2; let customer; let customer2;
let restaurant; let category; let item; let item2;

beforeAll(async () => {
  await connect();
  admin = await createStaff('admin');
  owner = await createStaff('restaurant_admin');
  owner2 = await createStaff('restaurant_admin');
  customer = await register();
  customer2 = await register();
});
afterAll(disconnect);

describe('Authentication', () => {
  test('register returns user + token, defaults to customer, never leaks password', async () => {
    const { res } = await register({ role: 'admin' }); // attempt to self-assign role
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.accessToken).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });
  test('duplicate email -> 409', async () => {
    const res = await api().post('/api/auth/register').send({
      name: 'Dup', email: customer.body.email, password: 'Password123!', phone: '+923001234567',
    });
    expect(res.status).toBe(409);
  });
  test('validation errors -> 422 with field details', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'x', email: 'bad', password: 'short', phone: '1' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });
  test('login ok / wrong password / unknown email', async () => {
    const ok = await api().post('/api/auth/login').send({ email: customer.body.email, password: 'Password123!' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe(customer.body.email);
    const bad = await api().post('/api/auth/login').send({ email: customer.body.email, password: 'Wrong123!' });
    expect(bad.status).toBe(401);
    const none = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Password123!' });
    expect(none.status).toBe(401);
    expect(none.body.message).toBe(bad.body.message); // no user enumeration
  });
  test('missing / invalid / expired token -> 401', async () => {
    expect((await api().get('/api/users/me')).status).toBe(401);
    expect((await api().get('/api/users/me').set(auth('garbage'))).status).toBe(401);
    const jwt = require('jsonwebtoken');
    const expired = jwt.sign({ sub: customer.user.id, tv: 0 }, 'test-secret', { expiresIn: -10 });
    const res = await api().get('/api/users/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });
  test('NoSQL operator injection in login is rejected', async () => {
    const res = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect([401, 422]).toContain(res.status);
  });
});

describe('Users', () => {
  test('get / update profile', async () => {
    const me = await api().get('/api/users/me').set(auth(customer.token));
    expect(me.status).toBe(200);
    const upd = await api().patch('/api/users/me').set(auth(customer.token)).send({ name: 'John Updated', phone: '+923009999999', role: 'admin' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.name).toBe('John Updated');
    expect(upd.body.data.role).toBe('customer');
  });
  test('change password revokes old tokens, new token works', async () => {
    const u = await register();
    const bad = await api().patch('/api/users/change-password').set(auth(u.token)).send({ currentPassword: 'nope', newPassword: 'NewPassword123!' });
    expect(bad.status).toBe(400);
    const res = await api().patch('/api/users/change-password').set(auth(u.token)).send({ currentPassword: 'Password123!', newPassword: 'NewPassword123!' });
    expect(res.status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(u.token))).status).toBe(401); // old token dead
    expect((await api().get('/api/users/me').set(auth(res.body.data.accessToken))).status).toBe(200);
    const login = await api().post('/api/auth/login').send({ email: u.body.email, password: 'NewPassword123!' });
    expect(login.status).toBe(200);
  });
  test('logout invalidates the token', async () => {
    const u = await register();
    expect((await api().post('/api/auth/logout').set(auth(u.token))).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(u.token))).status).toBe(401);
  });
});

describe('Restaurants', () => {
  test('customer cannot create a restaurant (403); anonymous gets 401', async () => {
    const payload = { name: 'Nope', address: '1 Street', city: 'Karachi' };
    expect((await api().post('/api/restaurants').set(auth(customer.token)).send(payload)).status).toBe(403);
    expect((await api().post('/api/restaurants').send(payload)).status).toBe(401);
  });
  test('restaurant admin creates; super admin must supply a valid owner', async () => {
    const res = await api().post('/api/restaurants').set(auth(owner.token)).send({
      name: 'Pizza Hub', description: 'Best pizza', address: '1 Main St', city: 'Karachi', phone: '+923001234567',
      deliveryFee: 100, minimumOrder: 300,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.owner).toBe(owner.user.id);
    restaurant = res.body.data;
    const noOwner = await api().post('/api/restaurants').set(auth(admin.token)).send({ name: 'Admin R', address: '2 St', city: 'Lahore' });
    expect(noOwner.status).toBe(422);
    const withOwner = await api().post('/api/restaurants').set(auth(admin.token)).send({ name: 'Other Place', address: '2 St', city: 'Lahore', owner: owner2.user.id });
    expect(withOwner.status).toBe(201);
  });
  test('public list supports search, city, pagination', async () => {
    const res = await api().get('/api/restaurants?search=pizza&city=karachi&page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5, total: 1, totalPages: 1 });
    expect(res.body.data[0].name).toBe('Pizza Hub');
    const none = await api().get('/api/restaurants?search=zzzz');
    expect(none.body.data).toHaveLength(0);
  });
  test('regex special chars in search do not break (escaped)', async () => {
    expect((await api().get('/api/restaurants?search=(%5B')).status).toBe(200);
  });
  test('invalid id -> 400, unknown id -> 404', async () => {
    expect((await api().get('/api/restaurants/not-an-id')).status).toBe(400);
    expect((await api().get('/api/restaurants/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
  });
  test("another restaurant admin cannot modify someone else's restaurant", async () => {
    const res = await api().patch(`/api/restaurants/${restaurant.id}`).set(auth(owner2.token)).send({ name: 'Hijacked' });
    expect(res.status).toBe(403);
  });
  test('owner updates; cannot self-reactivate or change owner', async () => {
    const res = await api().patch(`/api/restaurants/${restaurant.id}`).set(auth(owner.token)).send({ description: 'Updated', isActive: false, owner: owner2.user.id });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated');
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.owner).toBe(owner.user.id);
  });
});

describe('Categories & menu', () => {
  test('create category (owner), duplicate name -> 409, other owner -> 403', async () => {
    const res = await api().post(`/api/restaurants/${restaurant.id}/categories`).set(auth(owner.token)).send({ name: 'Burgers', description: 'Our premium burgers', sortOrder: 1 });
    expect(res.status).toBe(201);
    category = res.body.data;
    expect((await api().post(`/api/restaurants/${restaurant.id}/categories`).set(auth(owner.token)).send({ name: 'burgers' })).status).toBe(409);
    expect((await api().post(`/api/restaurants/${restaurant.id}/categories`).set(auth(owner2.token)).send({ name: 'Drinks' })).status).toBe(403);
    expect((await api().post(`/api/restaurants/${restaurant.id}/categories`).set(auth(customer.token)).send({ name: 'Drinks' })).status).toBe(403);
  });
  test('list / get / update category', async () => {
    const list = await api().get(`/api/restaurants/${restaurant.id}/categories`);
    expect(list.body.data).toHaveLength(1);
    expect((await api().get(`/api/categories/${category.id}`)).body.data.name).toBe('Burgers');
    const upd = await api().patch(`/api/categories/${category.id}`).set(auth(owner.token)).send({ description: 'New' });
    expect(upd.body.data.description).toBe('New');
  });
  test('create menu items; discount must be lower than price; category must belong to the restaurant', async () => {
    const body = { category: category.id, name: 'Zinger Burger', description: 'Crispy chicken burger', price: 650, discountPrice: 599, ingredients: ['Chicken', 'Lettuce'], preparationTime: 15 };
    const res = await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send(body);
    expect(res.status).toBe(201);
    expect(res.body.data.finalPrice).toBe(599);
    item = res.body.data;
    const bad = await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send({ ...body, name: 'Bad', discountPrice: 700 });
    expect(bad.status).toBe(422);
    const res2 = await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send({ category: category.id, name: 'Beef Burger', price: 800 });
    item2 = res2.body.data;
    const other = (await api().post('/api/restaurants').set(auth(admin.token)).send({ name: 'Third', address: '3 St', city: 'Karachi', owner: owner2.user.id })).body.data;
    const otherCat = (await api().post(`/api/restaurants/${other.id}/categories`).set(auth(owner2.token)).send({ name: 'Other' })).body.data;
    const wrong = await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send({ category: otherCat.id, name: 'Wrong', price: 100 });
    expect(wrong.status).toBe(422);
  });
  test('menu filters: category, search, price, availability, pagination', async () => {
    const base = `/api/restaurants/${restaurant.id}/menu`;
    expect((await api().get(`${base}?search=zinger`)).body.data).toHaveLength(1);
    expect((await api().get(`${base}?category=${category.id}`)).body.pagination.total).toBe(2);
    expect((await api().get(`${base}?minPrice=700&maxPrice=1000`)).body.data.map((i) => i.name)).toEqual(['Beef Burger']);
    expect((await api().get(`${base}?minPrice=500&maxPrice=600`)).body.data.map((i) => i.name)).toEqual(['Zinger Burger']); // uses discounted price
    expect((await api().get(`${base}?limit=1&page=2`)).body.data).toHaveLength(1);
    expect((await api().get(`${base}?minPrice=900&maxPrice=100`)).status).toBe(422);
  });
  test('update price recomputes finalPrice; availability toggle; ownership enforced', async () => {
    const upd = await api().patch(`/api/menu/${item2.id}`).set(auth(owner.token)).send({ price: 850 });
    expect(upd.body.data.finalPrice).toBe(850);
    const bad = await api().patch(`/api/menu/${item2.id}`).set(auth(owner.token)).send({ discountPrice: 900 });
    expect(bad.status).toBe(422);
    expect((await api().patch(`/api/menu/${item2.id}`).set(auth(owner2.token)).send({ price: 1 })).status).toBe(403);
    const av = await api().patch(`/api/menu/${item2.id}/availability`).set(auth(owner.token)).send({ isAvailable: false });
    expect(av.body.data.isAvailable).toBe(false);
    await api().patch(`/api/menu/${item2.id}/availability`).set(auth(owner.token)).send({ isAvailable: true });
  });
  test('restaurant details include categories with menu items', async () => {
    const res = await api().get(`/api/restaurants/${restaurant.id}`);
    expect(res.body.data.categories[0].menuItems).toHaveLength(2);
  });
  test('cannot delete a category that still has items (409)', async () => {
    expect((await api().delete(`/api/categories/${category.id}`).set(auth(owner.token))).status).toBe(409);
  });
});

describe('Cart', () => {
  test('only customers have carts', async () => {
    expect((await api().get('/api/cart').set(auth(owner.token))).status).toBe(403);
    expect((await api().get('/api/cart')).status).toBe(401);
  });
  test('empty cart, add (price from DB), merge quantities, validation', async () => {
    expect((await api().get('/api/cart').set(auth(customer.token))).body.data.items).toEqual([]);
    const add = await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 2, price: 1 }); // client price ignored
    expect(add.status).toBe(201);
    expect(add.body.data.items[0].price).toBe(599);
    expect(add.body.data.subtotal).toBe(1198);
    expect(add.body.data.deliveryFee).toBe(100);
    expect(add.body.data.total).toBe(1298);
    const again = await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    expect(again.body.data.items[0].quantity).toBe(3);
    expect((await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 0 })).status).toBe(422);
    expect((await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: '64b7f0f0f0f0f0f0f0f0f0f0', quantity: 1 })).status).toBe(404);
  });
  test('update quantity / remove item / clear', async () => {
    const upd = await api().patch(`/api/cart/items/${item.id}`).set(auth(customer.token)).send({ quantity: 1 });
    expect(upd.body.data.subtotal).toBe(599);
    expect((await api().patch(`/api/cart/items/${item.id}`).set(auth(customer.token)).send({ quantity: 0 })).status).toBe(422);
    expect((await api().patch(`/api/cart/items/${item2.id}`).set(auth(customer.token)).send({ quantity: 1 })).status).toBe(404);
    const rm = await api().delete(`/api/cart/items/${item.id}`).set(auth(customer.token));
    expect(rm.body.data.items).toEqual([]);
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    expect((await api().delete('/api/cart').set(auth(customer.token))).status).toBe(200);
    expect((await api().get('/api/cart').set(auth(customer.token))).body.data.items).toEqual([]);
  });
  test('unavailable item and cross-restaurant adds are rejected', async () => {
    await api().patch(`/api/menu/${item2.id}/availability`).set(auth(owner.token)).send({ isAvailable: false });
    expect((await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item2.id, quantity: 1 })).status).toBe(409);
    await api().patch(`/api/menu/${item2.id}/availability`).set(auth(owner.token)).send({ isAvailable: true });

    const other = (await api().post('/api/restaurants').set(auth(admin.token)).send({ name: 'Fourth', address: '4 St', city: 'Karachi', owner: owner2.user.id })).body.data;
    const oc = (await api().post(`/api/restaurants/${other.id}/categories`).set(auth(owner2.token)).send({ name: 'Mains' })).body.data;
    const oi = (await api().post(`/api/restaurants/${other.id}/menu`).set(auth(owner2.token)).send({ category: oc.id, name: 'Karahi', price: 1200 })).body.data;
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    const mixed = await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: oi.id, quantity: 1 });
    expect(mixed.status).toBe(409);
    const replaced = await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: oi.id, quantity: 1, replaceCart: true });
    expect(replaced.status).toBe(201);
    expect(replaced.body.data.items).toHaveLength(1);
    await api().delete('/api/cart').set(auth(customer.token));
  });
  test('price change and deleted item are reflected when the cart is read', async () => {
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item2.id, quantity: 1 });
    await api().patch(`/api/menu/${item.id}`).set(auth(owner.token)).send({ discountPrice: 500 });
    const tmp = (await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send({ category: category.id, name: 'Temp', price: 100 })).body.data;
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: tmp.id, quantity: 1 });
    await api().delete(`/api/menu/${tmp.id}`).set(auth(owner.token));
    const cart = (await api().get('/api/cart').set(auth(customer.token))).body.data;
    expect(cart.items.find((i) => i.menuItem === item.id).price).toBe(500);
    expect(cart.items).toHaveLength(2);
    expect(cart.warnings.map((w) => w.reason).sort()).toEqual(['price_changed', 'removed_from_menu']);
    await api().patch(`/api/menu/${item.id}`).set(auth(owner.token)).send({ discountPrice: 599 });
    await api().delete('/api/cart').set(auth(customer.token));
  });
});

describe('Orders', () => {
  const address = { address: 'House 123, Main Street', city: 'Karachi', postalCode: '75000' };
  const orderBody = { deliveryAddress: address, phone: '+923001234567', paymentMethod: 'cash', notes: 'Call me' };
  let order;

  test('empty cart -> 400', async () => {
    expect((await api().post('/api/orders').set(auth(customer.token)).send(orderBody)).status).toBe(400);
  });
  test('validation errors -> 422', async () => {
    expect((await api().post('/api/orders').set(auth(customer.token)).send({})).status).toBe(422);
  });
  test('place order: totals computed server-side, snapshot saved, cart cleared, client totals ignored', async () => {
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 2 });
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item2.id, quantity: 1 });
    const res = await api().post('/api/orders').set(auth(customer.token)).send({ ...orderBody, total: 1, subtotal: 1 });
    expect(res.status).toBe(201);
    order = res.body.data;
    expect(order.subtotal).toBe(599 * 2 + 850);
    expect(order.deliveryFee).toBe(100);
    expect(order.total).toBe(order.subtotal + 100);
    expect(order.orderStatus).toBe('pending');
    expect(order.orderNumber).toMatch(/^ORD-/);
    expect(order.items[0]).toMatchObject({ name: 'Zinger Burger', price: 599, quantity: 2, subtotal: 1198 });
    expect((await api().get('/api/cart').set(auth(customer.token))).body.data.items).toEqual([]);
  });
  test('order snapshot is unaffected by later price changes', async () => {
    await api().patch(`/api/menu/${item.id}`).set(auth(owner.token)).send({ price: 1000, discountPrice: null });
    const res = await api().get(`/api/orders/${order.id}`).set(auth(customer.token));
    expect(res.body.data.items[0].price).toBe(599);
    await api().patch(`/api/menu/${item.id}`).set(auth(owner.token)).send({ price: 650, discountPrice: 599 });
  });
  test('my-orders paginates and filters by status', async () => {
    const all = await api().get('/api/orders/my-orders?page=1&limit=10');
    expect(all.status).toBe(401);
    const res = await api().get('/api/orders/my-orders?page=1&limit=10').set(auth(customer.token));
    expect(res.body.pagination.total).toBe(1);
    expect((await api().get('/api/orders/my-orders?status=delivered').set(auth(customer.token))).body.data).toHaveLength(0);
    expect((await api().get('/api/orders/my-orders?status=bogus').set(auth(customer.token))).status).toBe(422);
  });
  test('order access rules: owner, restaurant admin, super admin allowed; others forbidden', async () => {
    const url = `/api/orders/${order.id}`;
    expect((await api().get(url).set(auth(customer.token))).status).toBe(200);
    expect((await api().get(url).set(auth(owner.token))).status).toBe(200);
    expect((await api().get(url).set(auth(admin.token))).status).toBe(200);
    expect((await api().get(url).set(auth(customer2.token))).status).toBe(403);
    expect((await api().get(url).set(auth(owner2.token))).status).toBe(403);
  });
  test('restaurant order list with filters; other owners forbidden', async () => {
    const base = `/api/restaurants/${restaurant.id}/orders`;
    const res = await api().get(`${base}?status=pending&page=1&limit=20`).set(auth(owner.token));
    expect(res.body.data).toHaveLength(1);
    expect((await api().get(`${base}?search=${order.orderNumber.slice(0, 8)}`).set(auth(owner.token))).body.data).toHaveLength(1);
    expect((await api().get(`${base}?search=ZZZZ`).set(auth(owner.token))).body.data).toHaveLength(0);
    expect((await api().get(`${base}?from=2999-01-01`).set(auth(owner.token))).body.data).toHaveLength(0);
    expect((await api().get(base).set(auth(owner2.token))).status).toBe(403);
    expect((await api().get(base).set(auth(customer.token))).status).toBe(403);
  });
  test('status transitions: customer cannot, invalid jumps rejected, full happy path works', async () => {
    const url = `/api/orders/${order.id}/status`;
    expect((await api().patch(url).set(auth(customer.token)).send({ status: 'confirmed' })).status).toBe(403);
    expect((await api().patch(url).set(auth(owner2.token)).send({ status: 'confirmed' })).status).toBe(403);
    expect((await api().patch(url).set(auth(owner.token)).send({ status: 'delivered' })).status).toBe(422); // skipping steps
    expect((await api().patch(url).set(auth(owner.token)).send({ status: 'nonsense' })).status).toBe(422);
    for (const s of ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']) {
      const r = await api().patch(url).set(auth(owner.token)).send({ status: s });
      expect(r.status).toBe(200);
      expect(r.body.data.orderStatus).toBe(s);
    }
    const final = await api().get(`/api/orders/${order.id}`).set(auth(customer.token));
    expect(final.body.data.paymentStatus).toBe('paid'); // cash collected on delivery
    expect(final.body.data.statusHistory.length).toBe(6);
    expect((await api().patch(url).set(auth(owner.token)).send({ status: 'pending' })).status).toBe(422); // final state
  });
  test('customer cancel: allowed while pending/confirmed, blocked later; only own orders', async () => {
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    const o = (await api().post('/api/orders').set(auth(customer.token)).send(orderBody)).body.data;
    expect((await api().patch(`/api/orders/${o.id}/cancel`).set(auth(customer2.token))).status).toBe(403);
    const c = await api().patch(`/api/orders/${o.id}/cancel`).set(auth(customer.token)).send({ reason: 'changed mind' });
    expect(c.status).toBe(200);
    expect(c.body.data.orderStatus).toBe('cancelled');
    expect((await api().patch(`/api/orders/${o.id}/cancel`).set(auth(customer.token))).status).toBe(409);

    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    const o2 = (await api().post('/api/orders').set(auth(customer.token)).send(orderBody)).body.data;
    for (const s of ['confirmed', 'preparing']) await api().patch(`/api/orders/${o2.id}/status`).set(auth(owner.token)).send({ status: s });
    expect((await api().patch(`/api/orders/${o2.id}/cancel`).set(auth(customer.token))).status).toBe(409);
  });
  test('checkout fails if an item became unavailable or the restaurant was deactivated', async () => {
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 });
    await api().patch(`/api/menu/${item.id}/availability`).set(auth(owner.token)).send({ isAvailable: false });
    const res = await api().post('/api/orders').set(auth(customer.token)).send(orderBody);
    expect(res.status).toBe(409);
    await api().patch(`/api/menu/${item.id}/availability`).set(auth(owner.token)).send({ isAvailable: true });

    await api().patch(`/api/admin/restaurants/${restaurant.id}/status`).set(auth(admin.token)).send({ isActive: false });
    expect((await api().post('/api/orders').set(auth(customer.token)).send(orderBody)).status).toBe(409);
    expect((await api().get(`/api/restaurants/${restaurant.id}`)).status).toBe(404); // hidden from the public
    expect((await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item.id, quantity: 1 })).status).toBe(409);
    await api().patch(`/api/admin/restaurants/${restaurant.id}/status`).set(auth(admin.token)).send({ isActive: true });
    await api().delete('/api/cart').set(auth(customer.token));
  });
  test('minimum order is enforced', async () => {
    const cheap = (await api().post(`/api/restaurants/${restaurant.id}/menu`).set(auth(owner.token)).send({ category: category.id, name: 'Mint', price: 50 })).body.data;
    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: cheap.id, quantity: 1 });
    expect((await api().post('/api/orders').set(auth(customer.token)).send(orderBody)).status).toBe(422);
    await api().delete('/api/cart').set(auth(customer.token));
  });
  test('coupons: percentage discount with cap, usage limit, expiry, invalid code', async () => {
    const mk = (b) => api().post('/api/admin/coupons').set(auth(admin.token)).send(b);
    expect((await mk({ code: 'SAVE10', discountType: 'percentage', discountValue: 10, maximumDiscount: 100, minimumOrder: 500, expiryDate: '2999-01-01', usageLimit: 1 })).status).toBe(201);
    expect((await mk({ code: 'SAVE10', discountType: 'fixed', discountValue: 5, expiryDate: '2999-01-01' })).status).toBe(409);
    expect((await api().post('/api/admin/coupons').set(auth(customer.token)).send({})).status).toBe(403);

    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item2.id, quantity: 2 }); // 1700
    const res = await api().post('/api/orders').set(auth(customer.token)).send({ ...orderBody, couponCode: 'save10' });
    expect(res.status).toBe(201);
    expect(res.body.data.discount).toBe(100); // 10% of 1700 = 170, capped at 100
    expect(res.body.data.total).toBe(1700 + 100 - 100);

    await api().post('/api/cart/items').set(auth(customer.token)).send({ menuItemId: item2.id, quantity: 2 });
    const used = await api().post('/api/orders').set(auth(customer.token)).send({ ...orderBody, couponCode: 'SAVE10' });
    expect(used.status).toBe(422); // usage limit reached
    expect((await api().get('/api/cart').set(auth(customer.token))).body.data.items).toHaveLength(1); // cart preserved on failure
    const bogus = await api().post('/api/orders').set(auth(customer.token)).send({ ...orderBody, couponCode: 'NOPE' });
    expect(bogus.status).toBe(422);
    await api().delete('/api/cart').set(auth(customer.token));
  });
  // Relies on MongoDB's atomic findOneAndDelete. Some Mongo-compatible servers (e.g. FerretDB) are not
  // atomic here, so it can be skipped with SKIP_ATOMICITY_TESTS=1 when running against one of those.
  const atomic = process.env.SKIP_ATOMICITY_TESTS ? test.skip : test;
  atomic('double submit only creates one order', async () => {
    await api().post('/api/cart/items').set(auth(customer2.token)).send({ menuItemId: item2.id, quantity: 1 });
    const [a, b] = await Promise.all([
      api().post('/api/orders').set(auth(customer2.token)).send(orderBody),
      api().post('/api/orders').set(auth(customer2.token)).send(orderBody),
    ]);
    expect([a.status, b.status].filter((s) => s === 201)).toHaveLength(1);
    expect((await api().get('/api/orders/my-orders').set(auth(customer2.token))).body.pagination.total).toBe(1);
  });
});

describe('Admin', () => {
  test('all admin routes require super admin', async () => {
    for (const path of ['/api/admin/users', '/api/admin/restaurants', '/api/admin/orders', '/api/admin/dashboard']) {
      expect((await api().get(path)).status).toBe(401);
      expect((await api().get(path).set(auth(customer.token))).status).toBe(403);
      expect((await api().get(path).set(auth(owner.token))).status).toBe(403);
      expect((await api().get(path).set(auth(admin.token))).status).toBe(200);
    }
  });
  test('dashboard statistics', async () => {
    const { data } = (await api().get('/api/admin/dashboard').set(auth(admin.token))).body;
    expect(data.totalUsers).toBeGreaterThanOrEqual(5);
    expect(data.totalRestaurants).toBeGreaterThanOrEqual(3);
    expect(data.completedOrders).toBe(1);
    expect(data.totalRevenue).toBe(599 * 2 + 850 + 100);
    expect(data.todaysOrders).toBeGreaterThanOrEqual(1);
    expect(data).toHaveProperty('pendingOrders');
  });
  test('block / unblock user; blocked user is locked out immediately', async () => {
    const u = await register();
    expect((await api().patch(`/api/admin/users/${u.user.id}/block`).set(auth(admin.token))).status).toBe(200);
    expect((await api().get('/api/users/me').set(auth(u.token))).status).toBe(401); // session revoked
    const login = await api().post('/api/auth/login').send({ email: u.body.email, password: 'Password123!' });
    expect(login.status).toBe(403);
    await api().patch(`/api/admin/users/${u.user.id}/unblock`).set(auth(admin.token));
    expect((await api().post('/api/auth/login').send({ email: u.body.email, password: 'Password123!' })).status).toBe(200);
    expect((await api().patch(`/api/admin/users/${admin.user.id}/block`).set(auth(admin.token))).status).toBe(400); // not yourself
  });
  test('list users with filters; list orders; deactivate via DELETE (soft)', async () => {
    expect((await api().get('/api/admin/users?role=restaurant_admin').set(auth(admin.token))).body.data.every((x) => x.role === 'restaurant_admin')).toBe(true);
    expect((await api().get('/api/admin/orders?status=delivered').set(auth(admin.token))).body.pagination.total).toBe(1);
    expect((await api().delete(`/api/restaurants/${restaurant.id}`).set(auth(owner.token))).status).toBe(403);
    const del = await api().delete(`/api/restaurants/${restaurant.id}`).set(auth(admin.token));
    expect(del.status).toBe(200);
    expect(del.body.data.isActive).toBe(false);
    const inactive = await api().get('/api/admin/restaurants?isActive=false').set(auth(admin.token));
    expect(inactive.body.data.map((r) => r.id)).toContain(restaurant.id);
  });
});

describe('Misc', () => {
  test('unknown route -> 404 JSON; malformed JSON -> 400', async () => {
    const r = await api().get('/api/nope');
    expect(r.status).toBe(404);
    expect(r.body.success).toBe(false);
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
  });
});
