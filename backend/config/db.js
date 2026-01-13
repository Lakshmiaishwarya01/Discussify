const mongoose = require('mongoose')

const connectDB = async () => {
    try{
        const connection = await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB Connected Successfully")
    } catch(error){
        console.log("MongoDB Connection Failed")
        process.exit(1)
    }
}

module.exports = connectDB