const Notification = require('../models/Notification');
const Community = require('../models/Community');
const User = require('../models/User');

exports.createNotification = async (type, data) => {
    try {
        // Extract recipientId from data if it exists
        const { actor, communityId, targetId, message, link, recipientId } = data;

        // ------------------------------------------
        // SCENARIO 1: Fan-Out (1-to-Many)
        // For Discussions and Resources, we notify all members
        // ------------------------------------------
        if (type === 'discussion' || type === 'resource') {
            const community = await Community.findById(communityId).populate('members.user');
            
            // Filter members who have the setting enabled AND are not the actor
            const recipients = community.members
                .filter(m => 
                    m.user._id.toString() !== actor.toString() && 
                    m.user.notificationPreferences?.[type === 'discussion' ? 'newDiscussion' : 'newResource'] !== false
                )
                .map(m => ({
                    recipient: m.user._id,
                    sender: actor,
                    type,
                    community: communityId,
                    link,
                    message
                }));

            if (recipients.length > 0) {
                await Notification.insertMany(recipients);
            }
        }

        // ------------------------------------------
        // SCENARIO 2: Direct (1-to-1)
        // For Replies AND Invites, we target a specific user
        // ------------------------------------------
        if (type === 'reply' || type === 'community_invite') {
            
            if (!recipientId) {
                console.error(`Notification Error: Type '${type}' requires a recipientId`);
                return;
            }

            const recipientUser = await User.findById(recipientId);
            
            // Safety check: User exists AND we aren't notifying ourselves
            if (recipientUser && recipientUser._id.toString() !== actor.toString()) {
                await Notification.create({
                    recipient: recipientUser._id,
                    sender: actor,
                    type,
                    community: communityId,
                    link,
                    message
                });
            }
        }

    } catch (error) {
        console.error("Notification Error:", error);
    }
};