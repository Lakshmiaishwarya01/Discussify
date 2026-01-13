const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();


router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.get('/stats', adminController.getStats);

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/ban', adminController.banUser);

router.delete('/communities/:id', adminController.forceDeleteCommunity);

module.exports = router;