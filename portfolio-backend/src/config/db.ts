import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    mongoose.connection.on('connected', () => {
      console.log('🍃 MongoDB Atlas connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Reconnecting...');
    });

    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    console.error('❌ Failed to establish initial MongoDB connection:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
