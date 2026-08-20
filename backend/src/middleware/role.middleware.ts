import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/response';

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden - Insufficient permissions', 403);
    }
    next();
  };
};
