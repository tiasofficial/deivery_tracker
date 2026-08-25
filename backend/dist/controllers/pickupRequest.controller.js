"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePickupRequest = exports.getPickupRequests = exports.createPickupRequest = void 0;
const prisma_1 = require("../config/prisma");
const response_1 = require("../utils/response");
const createPickupRequest = async (req, res) => {
    try {
        const { boxCount, vendorId } = req.body;
        if (!boxCount || !vendorId) {
            return (0, response_1.sendError)(res, 'boxCount and vendorId are required', 400);
        }
        const request = await prisma_1.prisma.pickupRequest.create({
            data: {
                boxCount: Number(boxCount),
                vendorId,
                driverId: req.user.id,
                status: 'PENDING'
            }
        });
        return (0, response_1.sendSuccess)(res, request, 'Pickup request created', 201);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.createPickupRequest = createPickupRequest;
const getPickupRequests = async (req, res) => {
    try {
        const where = req.user.role === 'VENDOR' ? { vendorId: req.user.id } : { driverId: req.user.id };
        const requests = await prisma_1.prisma.pickupRequest.findMany({
            where,
            include: { driver: true, vendor: true },
            orderBy: { createdAt: 'desc' }
        });
        return (0, response_1.sendSuccess)(res, requests, 'Pickup requests fetched');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.getPickupRequests = getPickupRequests;
const updatePickupRequest = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await prisma_1.prisma.pickupRequest.update({
            where: { id: req.params.id, vendorId: req.user.id },
            data: { status }
        });
        return (0, response_1.sendSuccess)(res, request, 'Pickup request updated');
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message, 400);
    }
};
exports.updatePickupRequest = updatePickupRequest;
