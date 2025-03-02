import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment variables with proper error handling
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      throw new Error('MongoDB connection string not found in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(connectionString, {
      dbName: process.env.DB_NAME || 'googlebooks'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    throw new Error('Database connection failed.');
  }
};

export default connectDB;
