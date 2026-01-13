const express = require('express')
const discussionController = require('../controllers/discussionController')
const commentController = require('../controllers/commentController')
const authMiddleware = require('../middlewares/authMiddleware')

// mergeParams to access :communityId from the parent router
const router = express.Router({mergeParams: true})

router.route('/')
    .get(authMiddleware.isLoggedIn, discussionController.getAllDiscussions)
    .post(authMiddleware.protect, discussionController.createDiscussion)

router.route('/:id')
    .get(authMiddleware.isLoggedIn, discussionController.getDiscussion)

router.route('/:discussionId/comments')
    .get(authMiddleware.isLoggedIn, commentController.getComments)
    .post(authMiddleware.protect, commentController.createComment)

router.route('/:id/like')
    .post(authMiddleware.protect, discussionController.likeDiscussion);

router.route('/:discussionId/comments/:commentId/like')
    .post(authMiddleware.protect, commentController.likeComment);

module.exports = router