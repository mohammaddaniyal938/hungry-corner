const router = require('express').Router();
const c = require('../controllers/admin.controller');
const v = require('../validators/admin.validator');
const rv = require('../validators/restaurant.validator');
const ov = require('../validators/order.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/dashboard', c.dashboard);

router.get('/users', validate(v.listUsers), c.listUsers);
router.patch('/users/:userId/block', validateId('userId'), c.blockUser);
router.patch('/users/:userId/unblock', validateId('userId'), c.unblockUser);
router.patch('/users/:userId/role', validateId('userId'), validate(v.setRole), c.setRole);

router.get('/restaurants', validate(v.listRestaurants), c.listRestaurants);
router.patch('/restaurants/:restaurantId/status', validateId('restaurantId'), validate(rv.setStatus), c.setRestaurantStatus);

router.get('/orders', validate(ov.adminOrders), c.listOrders);

router.get('/coupons', c.listCoupons);
router.post('/coupons', validate(v.createCoupon), c.createCoupon);
router.patch('/coupons/:couponId', validateId('couponId'), validate(v.updateCoupon), c.updateCoupon);
router.delete('/coupons/:couponId', validateId('couponId'), c.deleteCoupon);

module.exports = router;
