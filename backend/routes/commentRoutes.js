const express = require('express')
const commentController = require('../controllers/commentController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router({mergeParams: true})

router.route('/')
.get(authMiddleware.protect, commentController.getComments)
.post(authMiddleware.protect, commentController.createComment)

module.exports = router