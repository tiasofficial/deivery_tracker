import { TripStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export const getTrips = async (userId: string, role: string) => {
  const where = role === 'VENDOR' ? { vendorId: userId } : { driverId: userId };
  return prisma.trip.findMany({ where, include: { stops: true, driver: true, vendor: true } });
};

export const createTrip = async (vendorId: string, data: any) => {
  const { driverId, tripDate, transportFee, notes, stops } = data;

  const resolvedStops = [];
  for (const stop of stops) {
    let merchantId = stop.merchantId;
    if (!merchantId && stop.merchantName) {
      let merchant = await prisma.merchant.findFirst({
        where: { name: stop.merchantName.trim(), vendorId }
      });
      if (!merchant) {
        merchant = await prisma.merchant.create({
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
        let boxType = await prisma.boxType.findFirst({
          where: { name: box.boxName.trim(), vendorId }
        });
        if (!boxType) {
          boxType = await prisma.boxType.create({
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

  return prisma.trip.create({
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

export const getTripById = async (tripId: string, userId: string, role: string) => {
  const trip = await prisma.trip.findUnique({
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
  if (!trip) throw new Error('Trip not found');
  if (role === 'VENDOR' && trip.vendorId !== userId) throw new Error('Unauthorized');
  if (role === 'DRIVER' && trip.driverId !== userId) throw new Error('Unauthorized');
  return trip;
};

export const updateTrip = async (tripId: string, vendorId: string, data: any) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.vendorId !== vendorId) throw new Error('Trip not found or unauthorized');
  
  return prisma.trip.update({
    where: { id: tripId },
    data: {
      driverId: data.driverId,
      tripDate: data.tripDate ? new Date(data.tripDate) : undefined,
      transportFee: data.transportFee,
      notes: data.notes,
    },
  });
};

export const deleteTrip = async (tripId: string, vendorId: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.vendorId !== vendorId) throw new Error('Trip not found or unauthorized');
  return prisma.trip.delete({ where: { id: tripId } });
};

export const updateTripStatus = async (tripId: string, driverId: string, status: TripStatus, transportFee?: number) => {
  const trip = await prisma.trip.findUnique({ 
    where: { id: tripId },
    include: { stops: true }
  });
  if (!trip || trip.driverId !== driverId) throw new Error('Trip not found or unauthorized');

  const data: any = { status };

  if (status === 'COMPLETED') {
    // Automatically calculate total collected from all stops
    const totalCollected = trip.stops.reduce((acc, stop) => acc + Number(stop.collectedAmount || 0), 0);
    data.totalCollected = totalCollected;

    if (transportFee !== undefined) {
      data.transportFee = transportFee;
    }
  }

  return prisma.trip.update({ where: { id: tripId }, data });
};
