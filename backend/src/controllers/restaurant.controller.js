const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { getPagination, buildPagination } = require('../utils/pagination');
const { created, ok } = require('../utils/apiResponse');
const { ROLES } = require('../utils/constants');
const access = require('../services/access.service');

exports.list = asyncHandler(async (req, res) => {
  const { search, city, isOpen, isActive, sort } = req.query;
  const filter = {};
  // Only super admins may see inactive restaurants in the public listing.
  if (access.isSuperAdmin(req.user) && isActive && isActive !== 'all') filter.isActive = isActive === 'true';
  else if (!(access.isSuperAdmin(req.user) && isActive === 'all')) filter.isActive = true;
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (isOpen !== undefined) filter.isOpen = isOpen;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const pg = getPagination(req.query);
  const [items, total] = await Promise.all([
    Restaurant.find(filter).sort(sort === 'name' ? { name: 1 } : { createdAt: -1 }).skip(pg.skip).limit(pg.limit),
    Restaurant.countDocuments(filter),
  ]);
  ok(res, 'Restaurants fetched successfully', items, buildPagination(pg, total));
});

exports.get = asyncHandler(async (req, res) => {
  const { restaurant, privileged } = await access.getVisibleRestaurant(req.user, req.params.restaurantId);
  const catFilter = { restaurant: restaurant._id, ...(privileged ? {} : { isActive: true }) };
  const categories = await Category.find(catFilter).sort({ sortOrder: 1, name: 1 });
  const itemFilter = { restaurant: restaurant._id, category: { $in: categories.map((c) => c._id) } };
  const items = await MenuItem.find(itemFilter).sort({ name: 1 });
  const grouped = categories.map((c) => ({
    ...c.toJSON(),
    menuItems: items.filter((i) => String(i.category) === String(c._id)).map((i) => i.toJSON()),
  }));
  ok(res, 'Restaurant fetched successfully', { ...restaurant.toJSON(), categories: grouped });
});

exports.create = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  let ownerId = req.user._id;
  if (req.user.role === ROLES.ADMIN) {
    if (!body.owner) throw ApiError.unprocessable('Validation failed', [{ field: 'owner', message: "'owner' is required for super admins" }]);
    const owner = await User.findById(body.owner);
    if (!owner || owner.role !== ROLES.RESTAURANT_ADMIN) {
      throw ApiError.unprocessable('Validation failed', [{ field: 'owner', message: "'owner' must be an existing restaurant_admin user" }]);
    }
    ownerId = owner._id;
  }
  delete body.owner;
  const restaurant = await Restaurant.create({ ...body, owner: ownerId });
  created(res, 'Restaurant created successfully', restaurant);
});

exports.update = asyncHandler(async (req, res) => {
  const restaurant = await access.getManagedRestaurant(req.user, req.params.restaurantId);
  const body = { ...req.body };
  if (!access.isSuperAdmin(req.user)) {
    // Restaurant admins cannot reactivate themselves or hand the restaurant to someone else.
    delete body.isActive;
    delete body.owner;
  } else if (body.owner) {
    const owner = await User.findById(body.owner);
    if (!owner || owner.role !== ROLES.RESTAURANT_ADMIN) throw ApiError.unprocessable('owner must be an existing restaurant_admin user');
  }
  restaurant.set(body);
  await restaurant.save();
  ok(res, 'Restaurant updated successfully', restaurant);
});

// Soft delete: the restaurant (and its orders/menu) stay in the database but become hidden.
exports.remove = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  restaurant.isActive = false;
  await restaurant.save();
  ok(res, 'Restaurant deactivated successfully', restaurant);
});
