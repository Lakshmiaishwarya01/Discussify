const Comment = require('../models/Comment')
const Discussion = require('../models/Discussion')
const Activity = require('../models/Activity');

const notificationUtils = require('../utilities/notificationUtils');

exports.createComment = async (req, res, next) => {
    try{
        const discussion = await Discussion.findById(req.params.discussionId).populate('community');

        if(!discussion){
            let err = new Error("Discussion not found")
            err.status = 404
            throw err
        }

        const newComment = await Comment.create({
            content: req.body.content,
            discussion: req.params.discussionId,
            author: req.user.id,
            parentComment: req.body.parentComment || null
        })

        // If replying to a comment, notify that parent author. 
        // If top level, notify discussion author.
        let recipientId;
        if (req.body.parentComment) {
            const parent = await Comment.findById(req.body.parentComment);
            recipientId = parent.author;
        } else {
            recipientId = discussion.author;
        }

        notificationUtils.createNotification('reply', {
            actor: req.user.id,
            recipientId: recipientId,
            communityId: discussion.community._id,
            link: `/discussion/${discussion._id}`,
            message: `replied to your post in "${discussion.title}"`
        });

        await Activity.create({
            user: req.user.id,
            type: 'comment',
            targetId: newComment._id,
            title: discussion.title,
            communityName: discussion.community?.name || 'Unknown'
        });

        res.status(201).json({
            data: {
                comment: newComment
            }
        })
    } catch(error){
        next(error)
    }
}

exports.getComments = async (req, res, next) => {
    try{
        const comments = await Comment.find(
            {discussion: req.params.discussionId}
        ).populate('author', 'username photo').sort('createdAt')

        res.status(200).json({
            results: comments.length,
            data: { comments }
        })
    } catch(error){
        next(error)
    }
}

exports.likeComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            let err = new Error('Comment not found');
            err.status = 404;
            throw err;
        }

        const index = comment.likes.findIndex(id => id.toString() === req.user.id);

        if (index === -1) {
            comment.likes.push(req.user.id);
        } else {
            comment.likes.splice(index, 1);
        }

        await comment.save();

        res.status(200).json({
            status: 'success',
            data: { likes: comment.likes }
        });

    } catch (error) {
        next(error);
    }
};