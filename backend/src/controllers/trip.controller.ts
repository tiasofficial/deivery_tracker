import { Request, Response, NextFunction } from 'express';
import * as tripService from '../services/trip.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trips = await tripService.getTrips(req.user.id, req.user.role);
    return sendSuccess(res, trips, 'Trips fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const createTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripService.createTrip(req.user.id, req.body);
    return sendSuccess(res, trip, 'Trip created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getTripById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user.id, req.user.role);
    return sendSuccess(res, trip, 'Trip fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
    return sendSuccess(res, trip, 'Trip updated');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user.id);
    return sendSuccess(res, null, 'Trip deleted');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const startTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trip = await tripService.updateTripStatus(req.params.id, req.user.id, 'IN_PROGRESS');
    return sendSuccess(res, trip, 'Trip started');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const completeTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transportFee } = req.body;
    let fee: number | undefined = undefined;
    if (transportFee !== undefined && transportFee !== null && transportFee !== '') {
      fee = Number(transportFee);
    }
    const trip = await tripService.updateTripStatus(req.params.id, req.user.id, 'COMPLETED', fee);
    return sendSuccess(res, trip, 'Trip completed');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
