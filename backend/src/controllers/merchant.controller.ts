import { Request, Response, NextFunction } from 'express';
import * as merchantService from '../services/merchant.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMerchants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchants = await merchantService.getMerchants(req.user.id);
    return sendSuccess(res, merchants, 'Merchants fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const createMerchant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchant = await merchantService.createMerchant(req.user.id, req.body);
    return sendSuccess(res, merchant, 'Merchant created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateMerchant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchant = await merchantService.updateMerchant(req.params.id, req.user.id, req.body);
    return sendSuccess(res, merchant, 'Merchant updated');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deleteMerchant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await merchantService.deleteMerchant(req.params.id, req.user.id);
    return sendSuccess(res, null, 'Merchant deleted');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getMerchantHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await merchantService.getMerchantHistory(req.params.id, req.user.id);
    return sendSuccess(res, history, 'Merchant history fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
