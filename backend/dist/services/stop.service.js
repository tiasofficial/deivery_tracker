"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipStop = exports.updateStopDetails = exports.collectAtStop = exports.updateStopStatus = void 0;
const prisma_1 = require("../config/prisma");
const verifyTripAndStop = async (tripId, stopId, userId, role) => {
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    if (!trip) {
        console.log(`verifyTripAndStop: Trip ${tripId} not found`);
        throw new Error('Trip not found or unauthorized');
    }
    if (role === 'DRIVER' && trip.driverId !== userId) {
        console.log(`verifyTripAndStop: Driver ID mismatch. Trip has ${trip.driverId}, driver has ${userId}`);
        throw new Error('Trip not found or unauthorized');
    }
    if (role === 'VENDOR' && trip.vendorId !== userId) {
        console.log(`verifyTripAndStop: Vendor ID mismatch. Trip has ${trip.vendorId}, vendor has ${userId}`);
        throw new Error('Trip not found or unauthorized');
    }
    const stop = trip.stops.find(s => s.id === stopId);
    if (!stop) {
        console.log(`verifyTripAndStop: Stop ${stopId} not found in trip stops`);
        throw new Error('Stop not found in this trip');
    }
    return { trip, stop };
};
const updateStopStatus = async (tripId, stopId, userId, status, role) => {
    console.log(`updateStopStatus called with: tripId=${tripId}, stopId=${stopId}, userId=${userId}, status=${status}`);
    try {
        await verifyTripAndStop(tripId, stopId, userId, role);
        const data = { status };
        if (status === 'ARRIVED')
            data.arrivedAt = new Date();
        if (status === 'DELIVERED')
            data.deliveredAt = new Date();
        const updated = await prisma_1.prisma.routeStop.update({ where: { id: stopId }, data });
        console.log(`Prisma update success: stopId=${stopId} set to status=${updated.status}`);
        return updated;
    }
    catch (error) {
        console.error('Error inside updateStopStatus service:', error.message || error);
        throw error;
    }
};
exports.updateStopStatus = updateStopStatus;
const collectAtStop = async (tripId, stopId, userId, amount, skipReason, role) => {
    await verifyTripAndStop(tripId, stopId, userId, role);
    const stop = await prisma_1.prisma.routeStop.update({
        where: { id: stopId },
        data: {
            status: 'COLLECTED',
            collectedAmount: amount,
            collectedAt: new Date(),
            arrivedAt: new Date(),
            deliveredAt: new Date(),
            skipReason: skipReason || null,
            skipped: false
        },
    });
    // Update trip total collected and auto-complete if all stops done
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
    const allCompleted = trip?.stops && trip.stops.length > 0 && trip.stops.every(s => s.status === 'COLLECTED' || s.status === 'SKIPPED');
    const tripUpdateData = { totalCollected: total };
    if (allCompleted && trip?.status !== 'COMPLETED' && trip?.status !== 'SETTLED') {
        tripUpdateData.status = 'COMPLETED';
    }
    await prisma_1.prisma.trip.update({ where: { id: tripId }, data: tripUpdateData });
    return stop;
};
exports.collectAtStop = collectAtStop;
const updateStopDetails = async (tripId, stopId, userId, role, updateData) => {
    await verifyTripAndStop(tripId, stopId, userId, role);
    const dataToUpdate = {};
    if (updateData.collectedAmount !== undefined) {
        dataToUpdate.collectedAmount = updateData.collectedAmount;
    }
    if (updateData.status !== undefined) {
        dataToUpdate.status = updateData.status;
        if (updateData.status === 'COLLECTED') {
            dataToUpdate.collectedAt = new Date();
        }
    }
    if (updateData.skipped !== undefined) {
        dataToUpdate.skipped = updateData.skipped;
    }
    if (updateData.skipReason !== undefined) {
        dataToUpdate.skipReason = updateData.skipReason;
    }
    const updatedStop = await prisma_1.prisma.routeStop.update({
        where: { id: stopId },
        data: dataToUpdate,
        include: {
            merchant: true,
            boxes: {
                include: { boxType: true }
            }
        }
    });
    // Recalculate trip total collected and auto-complete if all stops done
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
    const allCompleted = trip?.stops && trip.stops.length > 0 && trip.stops.every(s => s.status === 'COLLECTED' || s.status === 'SKIPPED');
    const tripUpdateData = { totalCollected: total };
    if (allCompleted && trip?.status !== 'COMPLETED' && trip?.status !== 'SETTLED') {
        tripUpdateData.status = 'COMPLETED';
    }
    await prisma_1.prisma.trip.update({ where: { id: tripId }, data: tripUpdateData });
    return updatedStop;
};
exports.updateStopDetails = updateStopDetails;
const skipStop = async (tripId, stopId, userId, reason, role) => {
    await verifyTripAndStop(tripId, stopId, userId, role);
    const updatedStop = await prisma_1.prisma.routeStop.update({
        where: { id: stopId },
        data: { status: 'SKIPPED', skipped: true, skipReason: reason, collectedAmount: 0 },
    });
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
    const allCompleted = trip?.stops && trip.stops.length > 0 && trip.stops.every(s => s.status === 'COLLECTED' || s.status === 'SKIPPED');
    const tripUpdateData = { totalCollected: total };
    if (allCompleted && trip?.status !== 'COMPLETED' && trip?.status !== 'SETTLED') {
        tripUpdateData.status = 'COMPLETED';
    }
    await prisma_1.prisma.trip.update({ where: { id: tripId }, data: tripUpdateData });
    return updatedStop;
};
exports.skipStop = skipStop;
