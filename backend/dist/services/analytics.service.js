"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoxesAnalytics = exports.getMerchantsAnalytics = exports.getDriversAnalytics = exports.getTripsAnalytics = exports.getCollections = exports.getSummary = void 0;
const prisma_1 = require("../config/prisma");
// Simplified implementations for the analytics requirements
const getSummary = async (vendorId, period) => {
    const trips = await prisma_1.prisma.trip.findMany({
        where: { vendorId },
        include: { driver: true }
    });
    const totalTrips = trips.length;
    // Net collection = totalCollected minus transportFee (what vendor actually receives)
    const totalCollection = trips
        .filter(t => t.status === 'COMPLETED' || t.status === 'SETTLED')
        .reduce((acc, trip) => acc + Number(trip.totalCollected || 0) - Number(trip.transportFee || 0), 0);
    // Unsettled balance also uses net amount
    const unsettledBalance = trips
        .filter(t => t.status === 'COMPLETED' && !t.isSettled)
        .reduce((acc, trip) => acc + Number(trip.totalCollected || 0) - Number(trip.transportFee || 0), 0);
    const activeDriverIds = new Set(trips
        .filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE')
        .map(t => t.driverId));
    const activeDrivers = activeDriverIds.size;
    return { totalTrips, totalCollection, activeDrivers, unsettledBalance };
};
exports.getSummary = getSummary;
const getCollections = async (vendorId, from, to) => {
    // Include both COMPLETED and SETTLED so chart shows all finished trips
    const where = { vendorId, status: { in: ['COMPLETED', 'SETTLED'] } };
    if (from && to) {
        // Filter by tripDate (the actual delivery date), not createdAt
        where.tripDate = { gte: new Date(from), lte: new Date(to) };
    }
    const trips = await prisma_1.prisma.trip.findMany({ where, select: { id: true, tripDate: true, totalCollected: true, transportFee: true } });
    return trips;
};
exports.getCollections = getCollections;
const getTripsAnalytics = async (vendorId, from, to) => {
    const where = { vendorId };
    if (from && to) {
        where.createdAt = { gte: new Date(from), lte: new Date(to) };
    }
    const trips = await prisma_1.prisma.trip.findMany({ where, select: { status: true } });
    const statusCounts = trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1;
        return acc;
    }, {});
    return statusCounts;
};
exports.getTripsAnalytics = getTripsAnalytics;
const getDriversAnalytics = async (vendorId, period) => {
    const drivers = await prisma_1.prisma.user.findMany({ where: { vendorId, role: 'DRIVER' }, include: { tripsAsDriver: true } });
    return drivers.map(d => ({
        id: d.id,
        name: d.name,
        totalTrips: d.tripsAsDriver.length,
        totalCollected: d.tripsAsDriver.reduce((acc, t) => acc + Number(t.totalCollected || 0), 0),
    }));
};
exports.getDriversAnalytics = getDriversAnalytics;
const getMerchantsAnalytics = async (vendorId, period) => {
    const merchants = await prisma_1.prisma.merchant.findMany({ where: { vendorId }, include: { stops: true } });
    return merchants.map(m => ({
        id: m.id,
        name: m.name,
        totalStops: m.stops.length,
    }));
};
exports.getMerchantsAnalytics = getMerchantsAnalytics;
const getBoxesAnalytics = async (vendorId, period) => {
    const boxes = await prisma_1.prisma.boxType.findMany({
        where: { vendorId },
        include: { stopBoxes: true }
    });
    return boxes.map(b => ({
        id: b.id,
        name: b.name,
        totalDelivered: b.stopBoxes.reduce((acc, sb) => acc + sb.quantity, 0),
    }));
};
exports.getBoxesAnalytics = getBoxesAnalytics;
