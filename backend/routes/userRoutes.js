const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const upload = require('../utilities/uploadUtils'); 

// Public Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protected Routes
router.use(authMiddleware.protect);

router.get('/activity', userController.getUserActivity);

router.get('/profile', userController.getProfile);

router.patch('/profile', 
    upload.single('photo'),
    userController.updateProfile
);

router.delete('/profile', userController.deleteUser);

router.get('/search', userController.searchUsers);

module.exports = router;