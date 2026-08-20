import { Request, Response, NextFunction } from 'express';
import * as driverService from '../services/driver.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const drivers = await driverService.getDrivers(req.user.id);
    return sendSuccess(res, drivers, 'Drivers fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const createDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await driverService.createDriver(req.user.id, req.body);
    return sendSuccess(res, driver, 'Driver created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getDriverById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await driverService.getDriverById(req.params.id, req.user.id);
    return sendSuccess(res, driver, 'Driver fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getDriverTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trips = await driverService.getDriverTrips(req.params.id, req.user.id);
    return sendSuccess(res, trips, 'Driver trips fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.user.id, req.body);
    return sendSuccess(res, driver, 'Driver updated');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updateDriverPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await driverService.updateDriverPassword(req.params.id, req.user.id, req.body.password);
    return sendSuccess(res, null, 'Driver password changed');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const deleteDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await driverService.deleteDriver(req.params.id, req.user.id);
    return sendSuccess(res, null, 'Driver account deleted');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

