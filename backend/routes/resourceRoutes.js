const express = require('express');
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../utilities/uploadUtils');

// mergeParams to mount this on /communities/:communityId/resources
const router = express.Router({ mergeParams: true });

router.route('/')
    .get(authMiddleware.isLoggedIn, resourceController.getAllResources)
    .post(
        authMiddleware.protect, 
        upload.single('resource'),
        resourceController.createResource
    );

module.exports = router;