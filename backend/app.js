const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path');

const requestLogger = require('./utilities/requestLogger')
const errorLogger = require('./utilities/errorLogger')

// Import Routers
const userRouter = require('./routes/userRoutes')
const communityRouter = require('./routes/communityRoutes')
const discussionRouter = require('./routes/discussionRoutes')
const notificationRouter = require('./routes/notificationRoutes')
const adminRouter = require('./routes/adminRoutes')

const app = express()

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'))
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')));

app.use(requestLogger)

app.get('/', (req, res) => {
  res.json({"message": "Discussify API is Healthy"})
})

app.use('/api/v1/users', userRouter)
app.use('/api/v1/communities', communityRouter)
app.use('/api/v1/discussions', discussionRouter)
app.use('/api/v1/notifications', notificationRouter)

app.use('/api/v1/admin', adminRouter)

app.use(errorLogger)

module.exports = app