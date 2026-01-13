const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getMyNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'username photo')
            .populate('community', 'name icon')
            .sort('-createdAt')
            .limit(50);

        const unreadCount = await Notification.countDocuments({ 
            recipient: req.user.id, 
            isRead: false 
        });

        res.status(200).json({
            data: { notifications, unreadCount }
        });
    } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const query = { recipient: req.user.id, isRead: false };
        if (req.params.id && req.params.id !== 'all') {
            query._id = req.params.id;
        }

        await Notification.updateMany(query, { isRead: true });

        res.status(200).json({ status: 'success' });
    } catch (error) { next(error); }
};

exports.updatePreferences = async (req, res, next) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { notificationPreferences: req.body },
            { new: true }
        );
        res.status(200).json({ data: { user: updatedUser } });
    } catch (error) { next(error); }
};