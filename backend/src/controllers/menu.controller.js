const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const { getPagination, buildPagination } = require('../utils/pagination');
const { created, ok } = require('../utils/apiResponse');
const access = require('../services/access.service');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  name: { name: 1 },
};

exports.list = asyncHandler(async (req, res) => {
  const { restaurant, privileged } = await access.getVisibleRestaurant(req.user, req.params.restaurantId);
  const { category, search, minPrice, maxPrice, available, sort } = req.query;
  const filter = { restaurant: restaurant._id };

  if (!privileged) {
    // Customers never see items that sit in a deactivated category.
    const active = await Category.find({ restaurant: restaurant._id, isActive: true }).select('_id');
    const ids = active.map((c) => String(c._id));
    if (category && !ids.includes(category)) filter.category = { $in: [] };
    else filter.category = category ? category : { $in: ids };
  } else if (category) filter.category = category;

  if (available !== undefined) filter.isAvailable = available;
  if (minPrice !== undefined || maxPrice !== undefined) {
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw ApiError.unprocessable('minPrice cannot be greater than maxPrice');
    }
    filter.finalPrice = { ...(minPrice !== undefined && { $gte: minPrice }), ...(maxPrice !== undefined && { $lte: maxPrice }) };
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { ingredients: rx }];
  }

  const pg = getPagination(req.query);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort(SORTS[sort] || SORTS.newest).skip(pg.skip).limit(pg.limit),
    MenuItem.countDocuments(filter),
  ]);
  ok(res, 'Menu fetched successfully', items, buildPagination(pg, total));
});

async function assertCategoryBelongs(categoryId, restaurantId) {
  const category = await Category.findById(categoryId);
  if (!category || String(category.restaurant) !== String(restaurantId)) {
    throw ApiError.unprocessable('Validation failed', [{ field: 'category', message: "'category' must be a category of this restaurant" }]);
  }
}

exports.create = asyncHandler(async (req, res) => {
  const restaurant = await access.getManagedRestaurant(req.user, req.params.restaurantId);
  await assertCategoryBelongs(req.body.category, restaurant._id);
  const item = await MenuItem.create({ ...req.body, restaurant: restaurant._id });
  created(res, 'Menu item created successfully', item);
});

async function loadItem(id) {
  const item = await MenuItem.findById(id);
  if (!item) throw ApiError.notFound('Menu item not found');
  return item;
}

exports.get = asyncHandler(async (req, res) => {
  const item = await loadItem(req.params.menuItemId);
  const { privileged } = await access.getVisibleRestaurant(req.user, item.restaurant);
  if (!privileged) {
    const category = await Category.findById(item.category);
    if (!category || !category.isActive) throw ApiError.notFound('Menu item not found');
  }
  ok(res, 'Menu item fetched successfully', item);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await loadItem(req.params.menuItemId);
  await access.getManagedRestaurant(req.user, item.restaurant);
  if (req.body.category) await assertCategoryBelongs(req.body.category, item.restaurant);
  item.set(req.body);
  await item.save(); // pre-validate hook re-checks discountPrice < price and recomputes finalPrice
  ok(res, 'Menu item updated successfully', item);
});

exports.setAvailability = asyncHandler(async (req, res) => {
  const item = await loadItem(req.params.menuItemId);
  await access.getManagedRestaurant(req.user, item.restaurant);
  item.isAvailable = req.body.isAvailable;
  await item.save();
  ok(res, `Menu item marked as ${item.isAvailable ? 'available' : 'unavailable'}`, item);
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await loadItem(req.params.menuItemId);
  await access.getManagedRestaurant(req.user, item.restaurant);
  await item.deleteOne(); // order history keeps its own name/price snapshot; carts self-heal on next read
  ok(res, 'Menu item deleted successfully', null);
});
