import { Request, Response, NextFunction } from 'express';
import * as stopService from '../services/stop.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const arriveAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'ARRIVED', req.user.role);
    return sendSuccess(res, stop, 'Arrived at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deliverAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.updateStopStatus(req.params.tripId, req.params.stopId, req.user.id, 'DELIVERED', req.user.role);
    return sendSuccess(res, stop, 'Delivered at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const collectAtStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.collectAtStop(
      req.params.tripId, 
      req.params.stopId, 
      req.user.id, 
      Number(req.body.amount || 0),
      req.body.remarks || req.body.reason || req.body.skipReason,
      req.user.role
    );
    return sendSuccess(res, stop, 'Collected at stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.updateStopDetails(
      req.params.tripId,
      req.params.stopId,
      req.user.id,
      req.user.role,
      {
        collectedAmount: req.body.collectedAmount !== undefined ? Number(req.body.collectedAmount) : undefined,
        status: req.body.status,
        skipped: req.body.skipped,
        skipReason: req.body.skipReason || req.body.remarks,
      }
    );
    return sendSuccess(res, stop, 'Stop updated successfully');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const skipStop = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await stopService.skipStop(req.params.tripId, req.params.stopId, req.user.id, req.body.reason, req.user.role);
    return sendSuccess(res, stop, 'Skipped stop');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

