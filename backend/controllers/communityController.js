const Community = require('../models/Community');
const Activity = require('../models/Activity');
const Discussion = require('../models/Discussion');
const notificationUtils = require('../utilities/notificationUtils');

// 1. Create Community
exports.createCommunity = async (req, res, next) => {
    try {
        const communityData = {
            name: req.body.name,
            description: req.body.description,
            isPrivate: req.body.isPrivate || false,
            creator: req.user.id,
            members: [{ user: req.user.id, role: 'admin' }]
        };

        const newCommunity = await Community.create(communityData);

        await Activity.create({
            user: req.user.id,
            type: 'created_community',
            targetId: newCommunity._id,
            title: newCommunity.name
        });

        res.status(201).json({ data: { community: newCommunity } });
    } catch (error) { next(error); }
};

// 2. Get All Communities
exports.getAllCommunities = async (req, res, next) => {
    try {
        let query = {};
        if (req.query.search) {
            query = { $text: { $search: req.query.search } };
        }
        const communities = await Community.find(query).sort('-createdAt');
        res.status(200).json({ results: communities.length, data: { communities } });
    } catch (error) { next(error); }
};

// 3. Get Single Community
exports.getCommunity = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('members.user', 'username photo')
            .populate('creator', 'username')
            .populate('pendingInvites', 'username'); // Important for Admin Page

        if (!community) {
            let err = new Error('No community found');
            err.status = 404;
            throw err;
        }
        res.status(200).json({ data: { community } });
    } catch (error) { next(error); }
};

// 4. Update Community (Creator Only)
exports.updateCommunity = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);

        if (community.creator.toString() !== req.user.id) {
            let err = new Error("Not authorized. Only the Creator can update settings.");
            err.status = 403;
            throw err;
        }

        const updateData = { ...req.body };
        if (req.file) updateData.icon = req.file.filename;

        const updatedCommunity = await Community.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ status: 'success', data: { community: updatedCommunity } });
    } catch (error) { next(error); }
};

// 5. Delete Community (Creator Only + Safety Check)
exports.deleteCommunity = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);
        
        if (!community) {
            let err = new Error("Community not found");
            err.status = 404;
            throw err;
        }

        if (community.creator.toString() !== req.user.id) {
            let err = new Error("Not authorized to delete this community");
            err.status = 403;
            throw err;
        }

        // SAFETY CHECK: Prevent delete if discussions exist
        const discussionCount = await Discussion.countDocuments({ community: req.params.id });
        if (discussionCount > 0) {
            let err = new Error(`Cannot delete community. There are ${discussionCount} active discussions. Please delete them first.`);
            err.status = 400;
            throw err;
        }

        await Community.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (error) { next(error); }
};

// 6. Join Community
exports.joinCommunity = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) {
            let err = new Error('No community found');
            err.status = 404;
            throw err;
        }

        const isMember = community.members.some(m => m.user.toString() === req.user.id);
        if (isMember) {
            let err = new Error("You are already a member");
            err.status = 400;
            throw err;
        }

        if (community.isPrivate) {
            const isPending = community.pendingInvites.some(id => id.toString() === req.user.id);
            if (isPending) {
                let err = new Error("Request already sent");
                err.status = 400;
                throw err;
            }
            community.pendingInvites.push(req.user.id);
            await community.save();
            return res.status(200).json({ "message": "Request sent. Waiting for approval.", data: { community } });
        }

        community.members.push({ user: req.user.id, role: 'member' });
        await community.save();

        await Activity.create({
            user: req.user.id,
            type: 'joined_community',
            targetId: community._id,
            title: community.name
        });

        res.status(200).json({ "message": "Successfully joined community", data: { community } });
    } catch (error) { next(error); }
};

// 7. Leave Community
exports.leaveCommunity = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) {
            let err = new Error("Community not found");
            err.status = 404;
            throw err;
        }

        if (community.creator.toString() === req.user.id) {
            let err = new Error("The creator cannot leave. You must delete the community instead.");
            err.status = 400;
            throw err;
        }

        await Community.findByIdAndUpdate(req.params.id, {
            $pull: { members: { user: req.user.id } }
        });

        await Activity.create({
            user: req.user.id,
            type: 'left_community',
            targetId: community._id,
            title: community.name
        });

        res.status(200).json({ "message": "Successfully left the community" });
    } catch (error) { next(error); }
};

// 8. Kick Member (Hierarchical)
exports.kickMember = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);
        const targetUserId = req.body.userId;

        // Find Roles
        const requester = community.members.find(m => m.user.toString() === req.user.id);
        const target = community.members.find(m => m.user.toString() === targetUserId);
        
        const requesterRole = requester ? requester.role : null;
        const targetRole = target ? target.role : null;

        // Permission Logic
        if (!requesterRole || requesterRole === 'member') {
            let err = new Error("Not authorized. Admins or Moderators only.");
            err.status = 403;
            throw err;
        }

        // Prevent Mod kicking Admin/Mod
        if (requesterRole === 'moderator' && (targetRole === 'admin' || targetRole === 'moderator')) {
            let err = new Error("Moderators cannot kick Admins or other Moderators.");
            err.status = 403;
            throw err;
        }

        // Prevent kicking Creator
        if (targetUserId === community.creator.toString()) {
            let err = new Error("You cannot kick the Community Creator.");
            err.status = 400;
            throw err;
        }

        await Community.findByIdAndUpdate(req.params.id, {
            $pull: { members: { user: targetUserId } }
        });

        res.status(200).json({ status: 'success', message: 'User kicked' });
    } catch (error) { next(error); }
};

// 9. Handle Join Requests (Admin or Mod)
exports.handleJoinRequest = async (req, res, next) => {
    try {
        const { userId, status } = req.body;
        const community = await Community.findById(req.params.id);

        const requester = community.members.find(m => m.user.toString() === req.user.id);
        
        if (!requester || (requester.role !== 'admin' && requester.role !== 'moderator')) {
            let err = new Error("Not authorized to manage requests");
            err.status = 403;
            throw err;
        }

        await Community.findByIdAndUpdate(req.params.id, {
            $pull: { pendingInvites: userId }
        });

        if (status === 'approved') {
            await Community.findByIdAndUpdate(req.params.id, {
                $push: { members: { user: userId, role: 'member' } }
            });
        }

        res.status(200).json({ status: 'success', message: `Request ${status}` });
    } catch (error) { next(error); }
};

// 10. Update Member Role (Creator Only)
exports.updateMemberRole = async (req, res, next) => {
    try {
        const { userId, role } = req.body; // 'moderator' or 'member'
        const community = await Community.findById(req.params.id);

        if (community.creator.toString() !== req.user.id) {
            let err = new Error("Only the Creator can manage roles");
            err.status = 403;
            throw err;
        }

        if (userId === req.user.id) {
            let err = new Error("You cannot change your own role");
            err.status = 400;
            throw err;
        }

        await Community.findOneAndUpdate(
            { _id: req.params.id, "members.user": userId },
            { $set: { "members.$.role": role } }
        );

        res.status(200).json({ status: 'success', message: `User role updated to ${role}` });
    } catch (error) { next(error); }
};

// 11. SEND INVITE (Admin Only)
exports.inviteUser = async (req, res, next) => {
    try {
        const community = await Community.findById(req.params.id);
        const targetUserId = req.body.userId;

        // Check Admin/Mod permissions
        const requester = community.members.find(m => m.user.toString() === req.user.id);
        if (!requester || (requester.role !== 'admin' && requester.role !== 'moderator')) {
            let err = new Error("Not authorized to invite members");
            err.status = 403;
            throw err;
        }

        // Check if already a member
        const isMember = community.members.some(m => m.user.toString() === targetUserId);
        if (isMember) {
            let err = new Error("User is already a member");
            err.status = 400;
            throw err;
        }

        // Check if already invited
        if (community.invitedUsers.includes(targetUserId)) {
            let err = new Error("User already invited");
            err.status = 400;
            throw err;
        }

        // Add to invited list
        community.invitedUsers.push(targetUserId);
        await community.save();

        // Send Notification
        await notificationUtils.createNotification('community_invite', {
            actor: req.user.id,
            recipientId: targetUserId,
            communityId: community._id,
            targetId: community._id,
            link: `/communities/${community._id}`,
            message: `invited you to join "${community.name}"`
        });

        res.status(200).json({ status: 'success', message: 'Invite sent' });
    } catch (error) { next(error); }
};

// 12. ACCEPT/DECLINE INVITE (Target User)
exports.respondToInvite = async (req, res, next) => {
    try {
        const { status } = req.body; // 'accept' or 'decline'
        const community = await Community.findById(req.params.id);

        // Check if user was actually invited
        if (!community.invitedUsers.includes(req.user.id)) {
            let err = new Error("No invite found for this community");
            err.status = 404;
            throw err;
        }

        // Remove from invited list
        await Community.findByIdAndUpdate(req.params.id, {
            $pull: { invitedUsers: req.user.id }
        });

        if (status === 'accept') {
            // Add to members directly (bypassing private checks because they were invited)
            await Community.findByIdAndUpdate(req.params.id, {
                $push: { members: { user: req.user.id, role: 'member' } }
            });
            res.status(200).json({ status: 'success', message: 'You have joined the community!' });
        } else {
            res.status(200).json({ status: 'success', message: 'Invite declined' });
        }

    } catch (error) { next(error); }
};