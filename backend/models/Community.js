const mongoose = require('mongoose')

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Community name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    icon: {
        type: String,
        default: ''
    },
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: [true, 'Community must have an admin']
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    members: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'Users'
            },
            role: {
                type: String,
                enum: ['member', 'moderator', 'admin'],
                default: 'member'
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    pendingInvites: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Users'
        }
    ],
    invitedUsers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Users'
    }],
    bannedUsers: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Users'
        }
    ]
}, { collection: "Communities", timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true} })

communitySchema.virtual('discussions', {
    ref: 'Discussions',
    foreignField: 'community',
    localField: '_id'
})

communitySchema.index({
    name: 'text',
    description: 'text'
})

module.exports = mongoose.model('Communities', communitySchema)