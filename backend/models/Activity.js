const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: true
    },
    type: {
        type: String,
        enum: ['created_community', 'joined_community', 'left_community', 'discussion', 'comment', 'resource'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    communityName: {
        type: String,
        default: ''
    }
}, { timestamps: true });

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);