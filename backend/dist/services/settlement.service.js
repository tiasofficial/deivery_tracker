"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettlementById = exports.createSettlement = exports.getSettlements = void 0;
const prisma_1 = require("../config/prisma");
const getSettlements = async (vendorId) => {
    return prisma_1.prisma.settlement.findMany({
        where: { vendorId },
        include: { trip: true, driver: true },
    });
};
exports.getSettlements = getSettlements;
const createSettlement = async (vendorId, data) => {
    const { tripId, amount, notes } = data;
    const trip = await prisma_1.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.vendorId !== vendorId)
        throw new Error('Trip not found');
    if (trip.isSettled)
        throw new Error('Trip already settled');
    const settlement = await prisma_1.prisma.settlement.create({
        data: {
            tripId,
            driverId: trip.driverId,
            vendorId,
            amount,
            notes,
        },
    });
    await prisma_1.prisma.trip.update({
        where: { id: tripId },
        data: { isSettled: true, status: 'SETTLED' },
    });
    return settlement;
};
exports.createSettlement = createSettlement;
const getSettlementById = async (settlementId, vendorId) => {
    const settlement = await prisma_1.prisma.settlement.findUnique({
        where: { id: settlementId },
        include: { trip: true, driver: true },
    });
    if (!settlement || settlement.vendorId !== vendorId)
        throw new Error('Settlement not found');
    return settlement;
};
exports.getSettlementById = getSettlementById;
