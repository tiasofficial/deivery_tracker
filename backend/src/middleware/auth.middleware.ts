import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';
import { sendError } from '../utils/response';

const prisma = new PrismaClient();

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, vendorId: true },
    });

    if (!user) {
      return sendError(res, 'Unauthorized - Invalid user', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Unauthorized - Invalid token', 401);
  }
};
