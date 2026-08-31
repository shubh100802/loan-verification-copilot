import app from './app';
import { connectDatabase } from './config/database';

connectDatabase();

export default app;
