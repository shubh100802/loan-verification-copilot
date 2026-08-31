import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = 'disconnected';
  if (dbStatus === 1) dbStatusText = 'connected';
  else if (dbStatus === 2) dbStatusText = 'connecting';
  else if (dbStatus === 3) dbStatusText = 'disconnecting';

  res.status(200).json({
    status: 'success',
    message: 'API is running',
    database: dbStatusText,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

export default router;
