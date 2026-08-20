import { Request, Response, NextFunction } from 'express';
import * as settlementService from '../services/settlement.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getSettlements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settlements = await settlementService.getSettlements(req.user.id);
    return sendSuccess(res, settlements, 'Settlements fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const createSettlement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settlement = await settlementService.createSettlement(req.user.id, req.body);
    return sendSuccess(res, settlement, 'Settlement created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getSettlementById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settlement = await settlementService.getSettlementById(req.params.id, req.user.id);
    return sendSuccess(res, settlement, 'Settlement fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
