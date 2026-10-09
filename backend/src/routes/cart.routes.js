const router = require('express').Router();
const c = require('../controllers/cart.controller');
const v = require('../validators/cart.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { ROLES } = require('../utils/constants');

// Carts belong to customers.
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/', c.get);
router.delete('/', c.clear);
router.post('/items', validate(v.addItem), c.addItem);
router.patch('/items/:menuItemId', validateId('menuItemId'), validate(v.updateItem), c.updateItem);
router.delete('/items/:menuItemId', validateId('menuItemId'), validate(v.removeItem), c.removeItem);

module.exports = router;
