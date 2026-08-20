import { Request, Response, NextFunction } from 'express';
import * as boxtypeService from '../services/boxtype.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBoxTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const types = await boxtypeService.getBoxTypes(req.user.id);
    return sendSuccess(res, types, 'Box types fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const createBoxType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const type = await boxtypeService.createBoxType(req.user.id, req.body);
    return sendSuccess(res, type, 'Box type created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateBoxType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const type = await boxtypeService.updateBoxType(req.params.id, req.user.id, req.body);
    return sendSuccess(res, type, 'Box type updated');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deleteBoxType = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await boxtypeService.deleteBoxType(req.params.id, req.user.id);
    return sendSuccess(res, null, 'Box type deleted');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
