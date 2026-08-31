import app from '../backend/src/app';
import { connectDatabase } from '../backend/src/config/database';

export default async function handler(req: any, res: any) {
  await connectDatabase();
  return app(req, res);
}
