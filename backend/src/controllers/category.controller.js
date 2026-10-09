const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { created, ok } = require('../utils/apiResponse');
const access = require('../services/access.service');

exports.list = asyncHandler(async (req, res) => {
  const { restaurant, privileged } = await access.getVisibleRestaurant(req.user, req.params.restaurantId);
  const filter = { restaurant: restaurant._id };
  const { isActive } = req.query;
  if (!privileged) filter.isActive = true;
  else if (isActive && isActive !== 'all') filter.isActive = isActive === 'true';
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  ok(res, 'Categories fetched successfully', categories);
});

exports.create = asyncHandler(async (req, res) => {
  const restaurant = await access.getManagedRestaurant(req.user, req.params.restaurantId);
  const category = await Category.create({ ...req.body, restaurant: restaurant._id });
  created(res, 'Category created successfully', category);
});

async function loadCategory(req) {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

exports.get = asyncHandler(async (req, res) => {
  const category = await loadCategory(req);
  const { privileged } = await access.getVisibleRestaurant(req.user, category.restaurant);
  if (!category.isActive && !privileged) throw ApiError.notFound('Category not found');
  ok(res, 'Category fetched successfully', category);
});

exports.update = asyncHandler(async (req, res) => {
  const category = await loadCategory(req);
  await access.getManagedRestaurant(req.user, category.restaurant);
  category.set(req.body);
  await category.save();
  ok(res, 'Category updated successfully', category);
});

exports.remove = asyncHandler(async (req, res) => {
  const category = await loadCategory(req);
  await access.getManagedRestaurant(req.user, category.restaurant);
  const itemCount = await MenuItem.countDocuments({ category: category._id });
  if (itemCount) {
    throw ApiError.conflict(
      `This category still has ${itemCount} menu item(s). Move or delete them first, or deactivate the category instead (PATCH isActive=false)`
    );
  }
  await category.deleteOne();
  ok(res, 'Category deleted successfully', null);
});
