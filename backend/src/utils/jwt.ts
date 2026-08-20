import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (payload: object, expiresIn: any = '7d') => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret);
};
