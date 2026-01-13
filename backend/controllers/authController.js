const jwt = require('jsonwebtoken')
const User = require('../models/User')
const crypto = require('crypto');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

exports.signup = async (req, res, next) => {
    try{
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        })

        const token = signToken(newUser._id)

        res.status(200).json({
            "mesage": "User successfully registered",
            token,
            newUser
        })
    } catch(error){
        next(error)
    }
}

exports.login = async (req, res, next) => {
    try{
        const {email, password} = req.body

        if(!email){
            let err = new Error("Email is required")
            err.status = 400
            throw err
        }
        if(!password){
            let err = new Error("Password is required")
            err.status = 400
            throw err
        }

        // +password is used because, in schema, we set select:false for password
        const user = await User.findOne({email}).select('+password')

        if(!user){
            let err = new Error("User not found")
            err.status = 404
            throw err
        }
        if(!await user.correctPassword(password, user.password)){
            let err = new Error("Invalid credentials")
            err.status = 401
            throw err
        }

        const token = signToken(user._id)

        res.status(200).json({token, user})

    } catch(error){
        next(error)
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        // Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            let err = new Error('There is no user with that email address.');
            err.status = 404;
            throw err;
        }

        // Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        
        // Save it to DB (validation off because we aren't changing password yet)
        await user.save({ validateBeforeSave: false });

        // Create the Reset URL
        const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

        // 5. "Send" the Email (Console Log Strategy)
        const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

        console.log("============ PASSWORD RESET LINK ============");
        console.log(resetURL);
        console.log("===========================================");

        res.status(200).json({
            status: 'success',
            message: 'Token sent! (Check Server Console)'
        });

    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        // Get user based on the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token) // Hash the token from URL
            .digest('hex');

        // Find user with that token AND check if token has not expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        // If token invalid or expired
        if (!user) {
            let err = new Error('Token is invalid or has expired');
            err.status = 400;
            throw err;
        }

        // Update Password
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        
        // Clear the reset fields
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password successfully updated! Please login.'
        });

    } catch (error) {
        next(error);
    }
};