import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Must be first

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
};

export default connectDB;
