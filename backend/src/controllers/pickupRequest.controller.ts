import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export const createPickupRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { boxCount } = req.body;
    let vendorId = req.body.vendorId;

    if (!boxCount || isNaN(Number(boxCount)) || Number(boxCount) <= 0) {
      return sendError(res, 'Valid boxCount is required', 400);
    }

    if (!vendorId) {
      const driver = await prisma.user.findUnique({ where: { id: req.user.id } });
      vendorId = driver?.vendorId;
    }

    if (!vendorId) {
      const defaultVendor = await prisma.user.findFirst({ where: { role: 'VENDOR' } });
      vendorId = defaultVendor?.id;
    }

    if (!vendorId) {
      return sendError(res, 'No associated vendor found for this driver', 400);
    }

    const request = await prisma.pickupRequest.create({
      data: {
        boxCount: Number(boxCount),
        vendorId,
        driverId: req.user.id,
        status: 'PENDING'
      }
    });
    return sendSuccess(res, request, 'Pickup request created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const getPickupRequests = async (req: AuthRequest, res: Response) => {
  try {
    const where = req.user.role === 'VENDOR' ? { vendorId: req.user.id } : { driverId: req.user.id };
    const requests = await prisma.pickupRequest.findMany({
      where,
      include: { driver: true, vendor: true },
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(res, requests, 'Pickup requests fetched');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};

export const updatePickupRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const request = await prisma.pickupRequest.update({
      where: { id: req.params.id, vendorId: req.user.id },
      data: { status }
    });
    return sendSuccess(res, request, 'Pickup request updated');
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
};
