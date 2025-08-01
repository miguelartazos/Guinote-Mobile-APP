import mongoose from 'mongoose';

export async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/guinote';

    await mongoose.connect(uri);

    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', error => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
