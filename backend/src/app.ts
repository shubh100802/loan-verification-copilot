import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import apiRouter from './routes/api';

const app: Express = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1', apiRouter);

// Root redirection or simple response
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Loan Data Verification Copilot API Server. Use /api/v1/health or /api/health for health checks.');
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

export default app;
