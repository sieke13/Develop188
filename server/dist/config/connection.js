import mongoose from 'mongoose';
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://geraave2:gerardo123@cluster0.iqwly.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {});
        console.log('📦 MongoDB Connected');
    }
    catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};
export default connectDB;
