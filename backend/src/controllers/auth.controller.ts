import { Request, Response } from 'express';
import User from '../models/user.model';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user || user.password !== password) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' }
        });
        return;
      }

      // Map DB roles to frontend role string formats
      let mappedRole = 'operator';
      if (user.role === 'REVIEWER') mappedRole = 'reviewer';
      else if (user.role === 'DATA_CONSUMER') mappedRole = 'consumer';

      res.status(200).json({
        success: true,
        data: {
          user_id: user.user_id,
          name: user.name,
          role: mappedRole,
          email: user.email
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: err.message }
      });
    }
  }
}
