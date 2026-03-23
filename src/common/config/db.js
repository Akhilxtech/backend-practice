import mongoose from "mongoose";

const connectMongo=async () => {
    try {
        const connectDb= await mongoose.connect(process.env.MONGO_URI)
        console.log(`Mongodb connected ${connectDb.connection.host}`);
    
    } catch (error) {
        console.log("error connecting Database: ",error);
        
    }
    
    
}




export default connectMongo