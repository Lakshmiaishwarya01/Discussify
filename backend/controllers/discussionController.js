const Discussion = require('../models/Discussion')
const Community = require('../models/Community')
const Activity = require('../models/Activity')

const notificationUtils = require('../utilities/notificationUtils')

exports.createDiscussion = async (req, res, next) => {
    try{
        const communityId = req.params.communityId
        const community = await Community.findById(communityId)

        if(!community){
            let err = new Error("Community not found")
            err.status = 404
            throw err
        }

        // Logic: Only members can post
        const isMember = community.members.some(
            (member) => member.user.toString() === req.user.id
        )

        if(!isMember){
            let err = new Error("You must join the community to post")
            err.status = 403
            throw err
        }

        const newDiscussion = await Discussion.create({
            title: req.body.title,
            content: req.body.content,
            community: communityId,
            author: req.user.id
        })

        await Community.findByIdAndUpdate(communityId,
            {updatedAt: Date.now()}
        )

        notificationUtils.createNotification('discussion', {
            actor: req.user.id,
            communityId: communityId,
            targetId: newDiscussion._id,
            link: `/discussion/${newDiscussion._id}`,
            message: `started a new discussion: "${newDiscussion.title}"`
        });

        // Log Activity
        await Activity.create({
            user: req.user.id,
            type: 'discussion',
            targetId: newDiscussion._id,
            title: newDiscussion.title,
            communityName: community.name
        });

        res.status(200).json({
            data: {
                discussion: newDiscussion
            }
        })

    } catch(error){
        next(error)
    }
}

exports.getAllDiscussions = async (req, res, next) => {
    try{
        const community = await Community.findById(req.params.communityId)
        if(!community){
            let err = new Error("Community not found")
            err.status = 404
            throw err
        }

        // --- PRIVACY GATE ---
        if(community.isPrivate){
            // 1. If Guest (not logged in) -> Block
            if(!req.user){
                let err = new Error("This community is private. Please login to view.")
                err.status = 401 // 401 = Unauthorized (Identity unknown)
                throw err
            }

            // 2. If Logged In but Not Member -> Block
            const isMember = community.members.some(
                (member) => member.user.toString() === req.user.id
            )

            if(!isMember){
                let err = new Error("This community is private. You must join to view.")
                err.status = 403 // 403 = Forbidden (Identity known, but no permission)
                throw err
            }
        }
        // If Public, code skips here and Guests can proceed.

        const discussions = await Discussion.find(
            {community: req.params.communityId}
        ).populate('author', 'username photo').sort('-createdAt')

        res.status(200).json({
            results: discussions.length,
            data: { discussions }
        })
    } catch(error){
        next(error)
    }
}

exports.getDiscussion = async (req, res, next) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username photo')
      .populate('community');

    if (!discussion) {
      return res.status(404).json({ status: 'fail', message: 'Discussion not found' });
    }

    // --- PRIVACY GATE ---
    const community = discussion.community;
    if (community.isPrivate) {
      // 1. Guest Check
      if (!req.user) {
        return res.status(401).json({ status: 'fail', message: 'Private community. Please login.' });
      }
      // 2. Member Check
      const isMember = community.members.some(m => m.user.toString() === req.user.id);
      if (!isMember) {
        return res.status(403).json({ status: 'fail', message: 'Private community. Members only.' });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { discussion }
    });
  } catch (err) {
    next(err);
  }
};

exports.likeDiscussion = async (req, res, next) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        
        if (!discussion) {
            let err = new Error('Discussion not found');
            err.status = 404;
            throw err;
        }

        // Toggle Logic
        // Using req.user.id is safe because this route is protected
        const index = discussion.likes.findIndex(id => id.toString() === req.user.id);

        if (index === -1) {
            discussion.likes.push(req.user.id);
        } else {
            discussion.likes.splice(index, 1);
        }

        await discussion.save();

        res.status(200).json({
            status: 'success',
            data: { likes: discussion.likes }
        });

    } catch (error) {
        next(error);
    }
};