import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await analyticsService.getSummary(req.user.id, req.query.period as string);
    return sendSuccess(res, summary, 'Summary fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getCollections = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const collections = await analyticsService.getCollections(req.user.id, req.query.from as string, req.query.to as string);
    return sendSuccess(res, collections, 'Collections fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getTripsAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trips = await analyticsService.getTripsAnalytics(req.user.id, req.query.from as string, req.query.to as string);
    return sendSuccess(res, trips, 'Trips analytics fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getDriversAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const drivers = await analyticsService.getDriversAnalytics(req.user.id, req.query.period as string);
    return sendSuccess(res, drivers, 'Drivers analytics fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getMerchantsAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchants = await analyticsService.getMerchantsAnalytics(req.user.id, req.query.period as string);
    return sendSuccess(res, merchants, 'Merchants analytics fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getBoxesAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const boxes = await analyticsService.getBoxesAnalytics(req.user.id, req.query.period as string);
    return sendSuccess(res, boxes, 'Boxes analytics fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
