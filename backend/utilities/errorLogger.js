const fs = require('fs')

const errorLogger = (error, req, res, next) => {
    // 1. Log the raw error to file (Keep this for debugging)
    let logData = `${new Date()} - ${req.method} - ${req.url}\n${error.stack}\n`
    fs.appendFile('ErrorLogger.txt', logData, (err) => {
        if(err) console.log('Failed to log error')
    })

    let statusCode = error.status || 500
    let message = error.message

    // Handle MongoDB Duplicate Key Error (E11000)
    if (error.code === 11000) {
        statusCode = 409; // 409 Conflict
        
        // error.keyValue looks like: { email: "test@test.com" } or { username: "gautham" }
        const field = Object.keys(error.keyValue)[0];
        
        // Capitalize the field name (e.g., "email" -> "Email")
        const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
        
        message = `${capitalizedField} already exists. Please use a different one.`;
    }

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(error.errors).map(val => val.message);
        message = messages.join('. ');
    }

    res.status(statusCode).json({
        status: 'error',
        message: message
    })
}

module.exports = errorLogger