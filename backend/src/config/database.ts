import mongoose from 'mongoose';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification';

  try {
    console.log(`[Database] Connecting to MongoDB at ${uri}...`);
    await mongoose.connect(uri);
    isConnected = true;
    console.log('[Database] MongoDB connection established successfully.');
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB connection listener error:', err);
});

// Clean up connections on process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('[Database] MongoDB connection closed due to app termination.');
  process.exit(0);
});
