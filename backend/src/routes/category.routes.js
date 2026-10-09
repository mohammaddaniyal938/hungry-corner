const router = require('express').Router();
const c = require('../controllers/category.controller');
const v = require('../validators/category.validator');
const { validate, validateId } = require('../middleware/validate.middleware');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadImage } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');

const staff = authorize(ROLES.ADMIN, ROLES.RESTAURANT_ADMIN);

router.get('/:categoryId', validateId('categoryId'), optionalAuthenticate, c.get);
router.patch('/:categoryId', validateId('categoryId'), authenticate, staff, uploadImage('categories'), validate(v.update), c.update);
router.delete('/:categoryId', validateId('categoryId'), authenticate, staff, c.remove);

module.exports = router;
