import { StopStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

const verifyTripAndStop = async (tripId: string, stopId: string, userId: string, role?: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
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

export const updateStopStatus = async (tripId: string, stopId: string, userId: string, status: StopStatus, role?: string) => {
  console.log(`updateStopStatus called with: tripId=${tripId}, stopId=${stopId}, userId=${userId}, status=${status}`);
  try {
    await verifyTripAndStop(tripId, stopId, userId, role);

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

export const collectAtStop = async (tripId: string, stopId: string, userId: string, amount: number, skipReason?: string, role?: string) => {
  await verifyTripAndStop(tripId, stopId, userId, role);
  
  const stop = await prisma.routeStop.update({
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
  
  // Update trip total collected
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
  const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
  await prisma.trip.update({ where: { id: tripId }, data: { totalCollected: total } });
  
  return stop;
};

export const updateStopDetails = async (
  tripId: string, 
  stopId: string, 
  userId: string, 
  role: string, 
  updateData: {
    collectedAmount?: number;
    status?: StopStatus;
    skipped?: boolean;
    skipReason?: string;
  }
) => {
  await verifyTripAndStop(tripId, stopId, userId, role);

  const dataToUpdate: any = {};
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

  const updatedStop = await prisma.routeStop.update({
    where: { id: stopId },
    data: dataToUpdate,
    include: {
      merchant: true,
      boxes: {
        include: { boxType: true }
      }
    }
  });

  // Recalculate trip total collected
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
  const total = trip?.stops.reduce((acc, s) => acc + Number(s.collectedAmount || 0), 0) || 0;
  await prisma.trip.update({ where: { id: tripId }, data: { totalCollected: total } });

  return updatedStop;
};

export const skipStop = async (tripId: string, stopId: string, userId: string, reason: string, role?: string) => {
  await verifyTripAndStop(tripId, stopId, userId, role);
  return prisma.routeStop.update({
    where: { id: stopId },
    data: { status: 'SKIPPED', skipped: true, skipReason: reason, collectedAmount: 0 },
  });
};
