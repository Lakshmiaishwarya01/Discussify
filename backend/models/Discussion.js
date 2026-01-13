const mongoose = require('mongoose')

const discussionSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    community: {
        type: mongoose.Schema.ObjectId,
        ref: 'Communities',
        required: true
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: "Users",
        required: true
    },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Users"
        }
    ],
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, { collection: "Discussions", timestamps: true })

discussionSchema.index({community: 1, createdAt: -1})
discussionSchema.index({title: 'text', content: 'text'})

discussionSchema.pre(/^find/, function(next){
    this.find({isDeleted: {$ne: true}})
    next()
})

module.exports = mongoose.model('Discussions', discussionSchema)