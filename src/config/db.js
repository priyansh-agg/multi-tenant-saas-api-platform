import mongoose from "mongoose";

const connectToDb = async()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully");
    }catch(err){
        console.error("❌ MongoDB connection failed");
        console.error(err);
        process.exit(1);
    }
}

export default connectToDb;