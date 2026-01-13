const mongoose = require('mongoose')
const dotenv = require('dotenv')
const express = require('express')

dotenv.config({path: './.env'})

const app = require('./app')
const connectDB = require('./config/db')

connectDB()

const PORT = process.env.PORT || 4200

const server = app.listen(PORT, () => {
    console.log(`Server listening to http://localhost:${PORT}`)
})