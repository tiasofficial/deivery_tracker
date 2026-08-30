import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Unauthorized - No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    if (!decoded || !decoded.id) {
      return sendError(res, 'Unauthorized - Invalid token payload', 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      vendorId: decoded.vendorId
    };

    next();
  } catch (error: any) {
    console.error('Auth verification error:', error?.message);
    return sendError(res, 'Unauthorized - Invalid token', 401);
  }
};

