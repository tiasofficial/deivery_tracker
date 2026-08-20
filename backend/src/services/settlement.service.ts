import { prisma } from '../config/prisma';

export const getSettlements = async (vendorId: string) => {
  return prisma.settlement.findMany({
    where: { vendorId },
    include: { trip: true, driver: true },
  });
};

export const createSettlement = async (vendorId: string, data: any) => {
  const { tripId, amount, notes } = data;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  
  if (!trip || trip.vendorId !== vendorId) throw new Error('Trip not found');
  if (trip.isSettled) throw new Error('Trip already settled');
  
  const settlement = await prisma.settlement.create({
    data: {
      tripId,
      driverId: trip.driverId,
      vendorId,
      amount,
      notes,
    },
  });
  
  await prisma.trip.update({
    where: { id: tripId },
    data: { isSettled: true, status: 'SETTLED' },
  });
  
  return settlement;
};

export const getSettlementById = async (settlementId: string, vendorId: string) => {
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
    include: { trip: true, driver: true },
  });
  if (!settlement || settlement.vendorId !== vendorId) throw new Error('Settlement not found');
  return settlement;
};
