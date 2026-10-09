const router = require('express').Router();
const c = require('../controllers/order.controller');
const v = require('../validators/order.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.post('/', authorize(ROLES.CUSTOMER), validate(v.create), c.create);
router.get('/my-orders', authorize(ROLES.CUSTOMER), validate(v.myOrders), c.myOrders); // before /:orderId
router.get('/:orderId', validateId('orderId'), c.get); // access rules enforced in the service
router.patch('/:orderId/cancel', validateId('orderId'), authorize(ROLES.CUSTOMER), validate(v.cancel), c.cancel);
router.patch('/:orderId/status', validateId('orderId'), authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN), validate(v.updateStatus), c.updateStatus);

module.exports = router;
