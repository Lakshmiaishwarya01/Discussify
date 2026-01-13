const User = require('../models/User');
const Community = require('../models/Community');
const Discussion = require('../models/Discussion');
const Resource = require('../models/Resource');

exports.getStats = async (req, res, next) => {
    try {
        const [users, communities, discussions, resources] = await Promise.all([
            User.countDocuments(),
            Community.countDocuments(),
            Discussion.countDocuments(),
            Resource.countDocuments()
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats: { users, communities, discussions, resources }
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find()
            .setOptions({ skipActiveCheck: true })
            .select('-password +active')
            .sort('-createdAt');

        res.status(200).json({
            results: users.length,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

// 👇 THIS IS THE FIXED FUNCTION
exports.banUser = async (req, res, next) => {
    try {
        const { active } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { active: active },
            { 
                new: true, 
                runValidators: true,
                skipActiveCheck: true
            }
        );

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }

        res.status(200).json({ 
            status: 'success',
            message: `User ${active ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        next(error);
    }
};

exports.forceDeleteCommunity = async (req, res, next) => {
    try {
        await Community.findByIdAndDelete(req.params.id);
        
        res.status(204).json({ message: 'Community deleted by Super Admin' });
    } catch (error) {
        next(error);
    }
};