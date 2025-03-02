import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment variables, with a fallback connection string
    const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/googlebooks';
    
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(connectionString, {
      // These options may no longer be needed in newer Mongoose versions
      // but are included for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
