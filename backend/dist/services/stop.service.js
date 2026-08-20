"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipStop = exports.collectAtStop = exports.updateStopStatus = void 0;
const prisma_1 = require("../config/prisma");
const verifyTripAndStop = async (tripId, stopId, driverId) => {
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    if (!trip) {
        console.log(`verifyTripAndStop: Trip ${tripId} not found`);
        throw new Error('Trip not found or unauthorized');
    }
    if (trip.driverId !== driverId) {
        console.log(`verifyTripAndStop: Driver ID mismatch. Trip has ${trip.driverId}, driver has ${driverId}`);
        throw new Error('Trip not found or unauthorized');
    }
    const stop = trip.stops.find(s => s.id === stopId);
    if (!stop) {
        console.log(`verifyTripAndStop: Stop ${stopId} not found in trip stops`);
        throw new Error('Stop not found in this trip');
    }
    return stop;
};
const updateStopStatus = async (tripId, stopId, driverId, status) => {
    console.log(`updateStopStatus called with: tripId=${tripId}, stopId=${stopId}, driverId=${driverId}, status=${status}`);
    try {
        const verifiedStop = await verifyTripAndStop(tripId, stopId, driverId);
        console.log(`verifyTripAndStop passed. Current stop status: ${verifiedStop.status}`);
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
const collectAtStop = async (tripId, stopId, driverId, amount) => {
    await verifyTripAndStop(tripId, stopId, driverId);
    const stop = await prisma_1.prisma.routeStop.update({
        where: { id: stopId },
        data: { status: 'COLLECTED', collectedAmount: amount, collectedAt: new Date() },
    });
    // Update trip total collected
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
    await prisma_1.prisma.trip.update({ where: { id: tripId }, data: { totalCollected: total } });
    return stop;
};
exports.collectAtStop = collectAtStop;
const skipStop = async (tripId, stopId, driverId, reason) => {
    await verifyTripAndStop(tripId, stopId, driverId);
    return prisma_1.prisma.routeStop.update({
        where: { id: stopId },
        data: { status: 'SKIPPED', skipped: true, skipReason: reason },
    });
};
exports.skipStop = skipStop;
