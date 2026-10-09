const router = require('express').Router();
const c = require('../controllers/menu.controller');
const v = require('../validators/menu.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);

router.get('/:menuItemId', validateId('menuItemId'), optionalAuthenticate, c.get);
router.patch('/:menuItemId/availability', validateId('menuItemId'), authenticate, staff, validate(v.availability), c.setAvailability);
router.patch('/:menuItemId', validateId('menuItemId'), authenticate, staff, uploadImage('menu'), validate(v.update), c.update);
router.delete('/:menuItemId', validateId('menuItemId'), authenticate, staff, c.remove);

module.exports = router;
