import { Request, Response, NextFunction } from 'express';
import * as stopService from '../services/stop.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const arriveAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'ARRIVED');
    return sendSuccess(res, stop, 'Arrived at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deliverAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'DELIVERED');
    return sendSuccess(res, stop, 'Delivered at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const collectAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.collectAtStop(req.params.tripId, req.params.stopId, req.user.id, req.body.amount);
    return sendSuccess(res, stop, 'Collected at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const skipStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.skipStop(req.params.tripId, req.params.stopId, req.user.id, req.body.reason);
    return sendSuccess(res, stop, 'Skipped stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
