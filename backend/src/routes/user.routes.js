const router = require('express').Router();
const c = require('../controllers/user.controller');
const v = require('../validators/auth.validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/me', c.getMe);
router.patch('/me', validate(v.updateProfile), c.updateMe);
router.patch('/change-password', validate(v.changePassword), c.changePassword);

module.exports = router;
