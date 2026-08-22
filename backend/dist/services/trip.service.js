"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTripStatus = exports.deleteTrip = exports.updateTrip = exports.getTripById = exports.createTrip = exports.getTrips = void 0;
const prisma_1 = require("../config/prisma");
const getTrips = async (userId, role) => {
    const where = role === 'VENDOR' ? { vendorId: userId } : { driverId: userId };
    return prisma_1.prisma.trip.findMany({
        where,
        include: {
            stops: { include: { merchant: true } },
            driver: true,
            vendor: true
        }
    });
};
exports.getTrips = getTrips;
const createTrip = async (vendorId, data) => {
    const { driverId, tripDate, transportFee, notes, stops } = data;
    const resolvedStops = [];
    for (const stop of stops) {
        let merchantId = stop.merchantId;
        if (!merchantId && stop.merchantName) {
            let merchant = await prisma_1.prisma.merchant.findFirst({
                where: { name: stop.merchantName.trim(), vendorId }
            });
            if (!merchant) {
                merchant = await prisma_1.prisma.merchant.create({
                    data: {
                        name: stop.merchantName.trim(),
                        address: 'Manual Entry',
                        vendorId
                    }
                });
            }
            merchantId = merchant.id;
        }
        const resolvedBoxes = [];
        for (const box of stop.boxes) {
            let boxTypeId = box.boxTypeId;
            if (!boxTypeId && box.boxName) {
                let boxType = await prisma_1.prisma.boxType.findFirst({
                    where: { name: box.boxName.trim(), vendorId }
                });
                if (!boxType) {
                    boxType = await prisma_1.prisma.boxType.create({
                        data: {
                            name: box.boxName.trim(),
                            vendorId
                        }
                    });
                }
                boxTypeId = boxType.id;
            }
            resolvedBoxes.push({
                boxTypeId,
                quantity: box.quantity
            });
        }
        resolvedStops.push({
            merchantId,
            stopOrder: stop.stopOrder,
            boxes: resolvedBoxes
        });
    }
    return prisma_1.prisma.trip.create({
        data: {
            vendorId,
            driverId,
            tripDate: new Date(tripDate),
            transportFee,
            notes,
            stops: {
                create: resolvedStops.map(stop => ({
                    merchantId: stop.merchantId,
                    stopOrder: stop.stopOrder,
                    boxes: {
                        create: stop.boxes.map(box => ({
                            boxTypeId: box.boxTypeId,
                            quantity: box.quantity
                        }))
                    }
                }))
            },
        },
        include: { stops: { include: { boxes: true } } },
    });
};
exports.createTrip = createTrip;
const getTripById = async (tripId, userId, role) => {
    const trip = await prisma_1.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
            stops: {
                include: {
                    boxes: { include: { boxType: true } },
                    merchant: true
                }
            },
            driver: true,
            vendor: true
        },
    });
    if (!trip)
        throw new Error('Trip not found');
    if (role === 'VENDOR' && trip.vendorId !== userId)
        throw new Error('Unauthorized');
    if (role === 'DRIVER' && trip.driverId !== userId)
        throw new Error('Unauthorized');
    return trip;
};
exports.getTripById = getTripById;
const updateTrip = async (tripId, vendorId, data) => {
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.vendorId !== vendorId)
        throw new Error('Trip not found or unauthorized');
    return prisma_1.prisma.trip.update({
        where: { id: tripId },
        data: {
            driverId: data.driverId,
            tripDate: data.tripDate ? new Date(data.tripDate) : undefined,
            transportFee: data.transportFee !== undefined ? data.transportFee : undefined,
            notes: data.notes,
            // Allow vendor to correct collected amount before settling
            totalCollected: data.totalCollected !== undefined ? data.totalCollected : undefined,
        },
    });
};
exports.updateTrip = updateTrip;
const deleteTrip = async (tripId, vendorId) => {
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    if (!trip || trip.vendorId !== vendorId)
        throw new Error('Trip not found or unauthorized');
    // Delete route stop boxes first
    const stopIds = trip.stops.map(s => s.id);
    if (stopIds.length > 0) {
        await prisma_1.prisma.routeStopBox.deleteMany({
            where: { stopId: { in: stopIds } }
        });
    }
    // Delete route stops
    await prisma_1.prisma.routeStop.deleteMany({
        where: { tripId }
    });
    // Delete settlements
    await prisma_1.prisma.settlement.deleteMany({
        where: { tripId }
    });
    return prisma_1.prisma.trip.delete({ where: { id: tripId } });
};
exports.deleteTrip = deleteTrip;
const updateTripStatus = async (tripId, driverId, status, transportFee) => {
    const trip = await prisma_1.prisma.trip.findUnique({
        where: { id: tripId },
        include: { stops: true }
    });
    if (!trip || trip.driverId !== driverId)
        throw new Error('Trip not found or unauthorized');
    if (trip.isSettled) {
        throw new Error('Cannot update status of a settled trip');
    }
    const data = { status };
    if (status === 'COMPLETED') {
        // Automatically calculate total collected from all stops
        const totalCollected = trip.stops.reduce((acc, stop) => acc + Number(stop.collectedAmount || 0), 0);
        data.totalCollected = totalCollected;
        if (transportFee !== undefined) {
            data.transportFee = transportFee;
        }
    }
    return prisma_1.prisma.trip.update({ where: { id: tripId }, data });
};
exports.updateTripStatus = updateTripStatus;
