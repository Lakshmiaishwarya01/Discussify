const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: true
    },
    type: {
        type: String,
        enum: ['discussion', 'resource', 'reply', 'join_request', 'community_invite'],
        required: true
    },
    community: {
        type: mongoose.Schema.ObjectId,
        ref: 'Communities'
    },
    link: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);