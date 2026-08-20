import { prisma } from '../config/prisma';

// Simplified implementations for the analytics requirements
export const getSummary = async (vendorId: string, period: string) => {
  const trips = await prisma.trip.findMany({ 
    where: { vendorId },
    include: { driver: true }
  });

  const totalTrips = trips.length;
  
  const totalCollection = trips
    .filter(t => t.status === 'COMPLETED' || t.status === 'SETTLED')
    .reduce((acc, trip) => acc + Number(trip.totalCollected || 0), 0);

  const unsettledBalance = trips
    .filter(t => t.status === 'COMPLETED' && !t.isSettled)
    .reduce((acc, trip) => acc + Number(trip.totalCollected || 0), 0);

  const activeDriverIds = new Set(
    trips
      .filter(t => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE')
      .map(t => t.driverId)
  );
  const activeDrivers = activeDriverIds.size;

  return { totalTrips, totalCollection, activeDrivers, unsettledBalance };
};

export const getCollections = async (vendorId: string, from: string, to: string) => {
  const where: any = { vendorId, status: 'COMPLETED' };
  if (from && to) {
    where.createdAt = { gte: new Date(from), lte: new Date(to) };
  }
  const trips = await prisma.trip.findMany({ where, select: { id: true, tripDate: true, totalCollected: true } });
  return trips;
};

export const getTripsAnalytics = async (vendorId: string, from: string, to: string) => {
  const where: any = { vendorId };
  if (from && to) {
    where.createdAt = { gte: new Date(from), lte: new Date(to) };
  }
  const trips = await prisma.trip.findMany({ where, select: { status: true } });
  const statusCounts = trips.reduce((acc: any, trip) => {
    acc[trip.status] = (acc[trip.status] || 0) + 1;
    return acc;
  }, {});
  return statusCounts;
};

export const getDriversAnalytics = async (vendorId: string, period: string) => {
  const drivers = await prisma.user.findMany({ where: { vendorId, role: 'DRIVER' }, include: { tripsAsDriver: true } });
  return drivers.map(d => ({
    id: d.id,
    name: d.name,
    totalTrips: d.tripsAsDriver.length,
    totalCollected: d.tripsAsDriver.reduce((acc, t) => acc + Number(t.totalCollected || 0), 0),
  }));
};

export const getMerchantsAnalytics = async (vendorId: string, period: string) => {
  const merchants = await prisma.merchant.findMany({ where: { vendorId }, include: { stops: true } });
  return merchants.map(m => ({
    id: m.id,
    name: m.name,
    totalStops: m.stops.length,
  }));
};

export const getBoxesAnalytics = async (vendorId: string, period: string) => {
  const boxes = await prisma.boxType.findMany({
    where: { vendorId },
    include: { stopBoxes: true }
  });
  return boxes.map(b => ({
    id: b.id,
    name: b.name,
    totalDelivered: b.stopBoxes.reduce((acc, sb) => acc + sb.quantity, 0),
  }));
};
