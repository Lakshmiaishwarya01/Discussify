const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username cannot be empty'],
        unique: true,
        trim: true,
        maxlength: [20, 'Username must be less than 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email address'],
        immutable: true
    },
    photo: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    bio: {
        type: String,
        maxlength: [250, 'Bio cannot exceed 250 characters']
    },
    notificationPreferences: {
        newDiscussion: { type: Boolean, default: true },
        newResource: { type: Boolean, default: true },
        replies: { type: Boolean, default: true }
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(e) {
                return e === this.password
            },
            message: 'Passwords do not match'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, { collection: "Users", timestamps: true })

// MIDDLEWARE 1: Hash password before saving
userSchema.pre('save', async function(next){
    if(!this.isModified('password'))
        return next()

    this.password = await bcrypt.hash(this.password, 12)

    this.passwordConfirm = undefined
    next()
})

// MIDDLEWARE 2: Soft delete query filter
userSchema.pre(/^find/, function(next){
    if(this.options && this.options.skipActiveCheck){
        return next()
    }
    
    this.find({active: {$ne: false}})
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.createPasswordResetToken = function() {
    // Generate a random 32-character hex string (The "Key")
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash it (The "Lock") - Security best practice
    // We save the HASHED version to the DB, but send the UNHASHED version to the user
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set Expiration (10 minutes)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // Return the unhashed token (to send via email/console)
    return resetToken;
};

const User = mongoose.model("Users", userSchema)

module.exports = User