const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../utils/constants');

const isSuperAdmin = (user) => user && user.role === ROLES.ADMIN;
const isStaff = (user) => user && (user.role === ROLES.ADMIN || user.role === ROLES.RESTAURANT_ADMIN);
const ownsRestaurant = (user, restaurant) => Boolean(user) && String(restaurant.owner) === String(user._id);
const canManage = (user, restaurant) => isSuperAdmin(user) || (user?.role === ROLES.RESTAURANT_ADMIN && ownsRestaurant(user, restaurant));

// Loads a restaurant and asserts the user may manage it (super admin or its owner).
async function getManagedRestaurant(user, restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  if (!canManage(user, restaurant)) throw ApiError.forbidden('You do not have permission to manage this restaurant');
  return restaurant;
}

// Public visibility: inactive restaurants are hidden from everyone except their managers.
async function getVisibleRestaurant(user, restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || (!restaurant.isActive && !canManage(user, restaurant))) {
    throw ApiError.notFound('Restaurant not found');
  }
  return { restaurant, privileged: canManage(user, restaurant) };
}

module.exports = { isSuperAdmin, isStaff, ownsRestaurant, canManage, getManagedRestaurant, getVisibleRestaurant };
