import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory if not present in CWD
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDatabase();

const server = app.listen(PORT, () => {
  console.log(`[Server] Loan Data Verification Copilot API is running on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/v1/health or http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (err: Error) => {
  console.error('[Unhandled Rejection] Shutting down...', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Uncaught Exception] Shutting down...', err.message);
  server.close(() => process.exit(1));
});
