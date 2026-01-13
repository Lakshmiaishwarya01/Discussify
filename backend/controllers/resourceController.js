const Resource = require('../models/Resource');
const Community = require('../models/Community');
const Activity = require('../models/Activity');
const notificationUtils = require('../utilities/notificationUtils');

exports.createResource = async (req, res, next) => {
    try {
        if (!req.file) {
            let err = new Error('Please upload a file');
            err.status = 400;
            throw err;
        }

        const communityId = req.params.communityId;
        const community = await Community.findById(communityId);

        if (!community) {
            let err = new Error('Community not found');
            err.status = 404;
            throw err;
        }

        const newResource = await Resource.create({
            title: req.body.title,
            description: req.body.description,
            fileUrl: req.file.filename,
            fileType: req.file.mimetype,
            community: communityId,
            author: req.user.id
        });

        await Community.findByIdAndUpdate(communityId,
            {updatedAt: Date.now()}
        )

        notificationUtils.createNotification('resource', {
            actor: req.user.id,
            communityId: communityId,
            targetId: newResource._id,
            link: `/communities/${communityId}`,
            message: `shared a new resource: "${newResource.title}"`
        });

        // Log the Activity
        await Activity.create({
            user: req.user.id,
            type: 'resource',
            targetId: newResource._id,
            title: newResource.title,
            communityName: community.name
        });

        res.status(201).json({
            data: { resource: newResource }
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllResources = async (req, res, next) => {
    try {
        const resources = await Resource.find({ community: req.params.communityId })
            .populate('author', 'username photo')
            .sort('-createdAt');

        res.status(200).json({
            results: resources.length,
            data: { resources }
        });
    } catch (error) {
        next(error);
    }
};