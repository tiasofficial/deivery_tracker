import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

export const getDrivers = async (vendorId: string) => {
  return prisma.user.findMany({
    where: { vendorId, role: 'DRIVER' },
    select: { id: true, name: true, email: true, phone: true, vehicleNo: true },
  });
};

export const createDriver = async (vendorId: string, data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: 'DRIVER',
      vendorId,
    },
    select: { id: true, name: true, email: true, phone: true, vehicleNo: true },
  });
};

export const getDriverById = async (driverId: string, vendorId: string) => {
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, name: true, email: true, phone: true, vehicleNo: true, vendorId: true },
  });
  if (!driver || driver.vendorId !== vendorId) throw new Error('Driver not found');
  return driver;
};

export const getDriverTrips = async (driverId: string, vendorId: string) => {
  await getDriverById(driverId, vendorId);
  return prisma.trip.findMany({ where: { driverId, vendorId } });
};

export const getDriverBalance = async (driverId: string, vendorId: string) => {
  await getDriverById(driverId, vendorId);
  
  const trips = await prisma.trip.findMany({
    where: { driverId, vendorId, isSettled: false, status: 'COMPLETED' },
  });
  
  const balance = trips.reduce((acc, t) => acc + Number(t.totalCollected || 0), 0);
  return { balance, pendingTrips: trips.length };
};

export const updateDriver = async (driverId: string, vendorId: string, data: any) => {
  await getDriverById(driverId, vendorId);
  return prisma.user.update({
    where: { id: driverId },
    data: {
      name: data.name,
      phone: data.phone,
      vehicleNo: data.vehicleNo
    },
    select: { id: true, name: true, email: true, phone: true, vehicleNo: true }
  });
};

export const updateDriverPassword = async (driverId: string, vendorId: string, password: string) => {
  await getDriverById(driverId, vendorId);
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: driverId },
    data: { password: hashedPassword }
  });
};

export const deleteDriver = async (driverId: string, vendorId: string) => {
  await getDriverById(driverId, vendorId);
  // Delete all stops related to driver's trips, then trips, then driver
  const trips = await prisma.trip.findMany({ where: { driverId } });
  const tripIds = trips.map(t => t.id);
  
  await prisma.routeStopBox.deleteMany({ where: { stop: { tripId: { in: tripIds } } } });
  await prisma.routeStop.deleteMany({ where: { tripId: { in: tripIds } } });
  await prisma.settlement.deleteMany({ where: { tripId: { in: tripIds } } });
  await prisma.trip.deleteMany({ where: { driverId } });
  
  return prisma.user.delete({ where: { id: driverId } });
};

