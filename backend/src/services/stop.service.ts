import { StopStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

const verifyTripAndStop = async (tripId: string, stopId: string, driverId: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
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

export const updateStopStatus = async (tripId: string, stopId: string, driverId: string, status: StopStatus) => {
  console.log(`updateStopStatus called with: tripId=${tripId}, stopId=${stopId}, driverId=${driverId}, status=${status}`);
  try {
    const verifiedStop = await verifyTripAndStop(tripId, stopId, driverId);
    console.log(`verifyTripAndStop passed. Current stop status: ${verifiedStop.status}`);

    const data: any = { status };
    if (status === 'ARRIVED') data.arrivedAt = new Date();
    if (status === 'DELIVERED') data.deliveredAt = new Date();
    
    const updated = await prisma.routeStop.update({ where: { id: stopId }, data });
    console.log(`Prisma update success: stopId=${stopId} set to status=${updated.status}`);
    return updated;
  } catch (error: any) {
    console.error('Error inside updateStopStatus service:', error.message || error);
    throw error;
  }
};

export const collectAtStop = async (tripId: string, stopId: string, driverId: string, amount: number) => {
  await verifyTripAndStop(tripId, stopId, driverId);
  
  const stop = await prisma.routeStop.update({
    where: { id: stopId },
    data: { status: 'COLLECTED', collectedAmount: amount, collectedAt: new Date() },
  });
  
  // Update trip total collected
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
  const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
  await prisma.trip.update({ where: { id: tripId }, data: { totalCollected: total } });
  
  return stop;
};

export const skipStop = async (tripId: string, stopId: string, driverId: string, reason: string) => {
  await verifyTripAndStop(tripId, stopId, driverId);
  return prisma.routeStop.update({
    where: { id: stopId },
    data: { status: 'SKIPPED', skipped: true, skipReason: reason },
  });
};
