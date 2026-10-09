const router = require('express').Router();
const c = require('../controllers/restaurant.controller');
const categoryCtrl = require('../controllers/category.controller');
const menuCtrl = require('../controllers/menu.controller');
const orderCtrl = require('../controllers/order.controller');
const rv = require('../validators/restaurant.validator');
const cv = require('../validators/category.validator');
const mv = require('../validators/menu.validator');
const ov = require('../validators/order.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);

// Restaurants
router.get('/', optionalAuthenticate, validate(rv.list), c.list);
router.post('/', authenticate, staff, uploadImage('restaurants'), validate(rv.create), c.create);
router.get('/:restaurantId', validateId('restaurantId'), optionalAuthenticate, c.get);
router.patch('/:restaurantId', validateId('restaurantId'), authenticate, staff, uploadImage('restaurants'), validate(rv.update), c.update);
router.delete('/:restaurantId', validateId('restaurantId'), authenticate, authorize(ROLES.ADMIN), c.remove);

// Categories (nested)
router.get('/:restaurantId/categories', validateId('restaurantId'), optionalAuthenticate, validate(cv.list), categoryCtrl.list);
router.post('/:restaurantId/categories', validateId('restaurantId'), authenticate, staff, uploadImage('categories'), validate(cv.create), categoryCtrl.create);

// Menu (nested)
router.get('/:restaurantId/menu', validateId('restaurantId'), optionalAuthenticate, validate(mv.list), menuCtrl.list);
router.post('/:restaurantId/menu', validateId('restaurantId'), authenticate, staff, uploadImage('menu'), validate(mv.create), menuCtrl.create);

// Restaurant orders
router.get('/:restaurantId/orders', validateId('restaurantId'), authenticate, staff, validate(ov.restaurantOrders), orderCtrl.restaurantOrders);

module.exports = router;
