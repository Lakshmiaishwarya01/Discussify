const fs = require('fs')

const requestLogger = (req, res, next) => {
    let logData = `${new Date()} - ${req.method} - ${req.url}\n`
    fs.appendFile('RequestLogger.txt', logData, (err) => {
        if(err) console.log('Failed to log request')
    })
    next()
}

module.exports = requestLogger