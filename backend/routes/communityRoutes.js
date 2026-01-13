const express = require('express')
const communityController = require('../controllers/communityController')
const authMiddleware = require('../middlewares/authMiddleware')
const upload = require('../utilities/uploadUtils')

const discussionRoutes = require('./discussionRoutes')
const resourceRouter = require('./resourceRoutes');

const router = express.Router()

router.use('/:communityId/discussions', discussionRoutes)
router.use('/:communityId/resources', resourceRouter);


router.route('/')
    .get(communityController.getAllCommunities)
    .post(authMiddleware.protect, communityController.createCommunity)

router.route('/:id')
    .get(communityController.getCommunity)
    .patch(
        authMiddleware.protect, 
        upload.single('icon'),
        communityController.updateCommunity
    ) 
    .delete(authMiddleware.protect, communityController.deleteCommunity);
 

router.route('/:id/join')
    .post(authMiddleware.protect, communityController.joinCommunity)

router.route('/:id/leave')
    .post(authMiddleware.protect, communityController.leaveCommunity)

router.route('/:id/kick')
    .patch(authMiddleware.protect, communityController.kickMember);

router.route('/:id/role')
    .patch(authMiddleware.protect, communityController.updateMemberRole);

router.route('/:id/requests')
    .patch(authMiddleware.protect, communityController.handleJoinRequest);


router.post('/:id/invite', authMiddleware.protect, communityController.inviteUser);

router.post('/:id/respond-invite', authMiddleware.protect, communityController.respondToInvite);

module.exports = router