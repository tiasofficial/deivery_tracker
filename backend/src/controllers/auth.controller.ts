import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 'Registered successfully', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, 'Logged in successfully');
  } catch (error: any) {
    return sendError(res, error.message, 401);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) throw new Error('User not found');
    const result = await authService.getMe(req.user.id);
    return sendSuccess(res, result, 'User fetched successfully');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
