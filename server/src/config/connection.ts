import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://geraave2:gerardo123@cluster0.iqwly.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

export default mongoose.connection;
