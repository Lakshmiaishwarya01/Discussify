const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/', notificationController.getMyNotifications);
router.patch('/mark-read/:id', notificationController.markAsRead);
router.patch('/preferences', notificationController.updatePreferences);

module.exports = router;