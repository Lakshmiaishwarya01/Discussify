const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment cannot be empty'],
        trim: true,
        maxlength: [5000, 'Comment cannot exceed 5000 characters']
    },
    discussion: {
        type: mongoose.Schema.ObjectId,
        ref: 'Discussions',
        required: [true, 'Comment must belong to a discussion']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'Users',
        required: [true, 'Comment must have an author']
    },
    parentComment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comments',
        default: null
    },
    likes: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Users'
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { collection: "Comments", timestamps: true })

commentSchema.index({discussion: 1, createdAt: 1})

commentSchema.pre(/^find/, function(next){
    this.populate({
        path: 'author',
        select: 'username photo'
    })
    next()
})

module.exports = mongoose.model("Comments", commentSchema)