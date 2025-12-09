import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected',()=>{
        console.log("Database connected successfully");
    })
    await mongoose.connect(`${process.env.MONGODB_URI}/greencart`);
  }catch(error){
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;