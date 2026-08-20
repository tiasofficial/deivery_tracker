"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDriver = exports.updateDriverPassword = exports.updateDriver = exports.getDriverBalance = exports.getDriverTrips = exports.getDriverById = exports.createDriver = exports.getDrivers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../config/prisma");
const getDrivers = async (vendorId) => {
    return prisma_1.prisma.user.findMany({
        where: { vendorId, role: 'DRIVER' },
        select: { id: true, name: true, email: true, phone: true, vehicleNo: true },
    });
};
exports.getDrivers = getDrivers;
const createDriver = async (vendorId, data) => {
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    return prisma_1.prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
            role: 'DRIVER',
            vendorId,
        },
        select: { id: true, name: true, email: true, phone: true, vehicleNo: true },
    });
};
exports.createDriver = createDriver;
const getDriverById = async (driverId, vendorId) => {
    const driver = await prisma_1.prisma.user.findUnique({
        where: { id: driverId },
        select: { id: true, name: true, email: true, phone: true, vehicleNo: true, vendorId: true },
    });
    if (!driver || driver.vendorId !== vendorId)
        throw new Error('Driver not found');
    return driver;
};
exports.getDriverById = getDriverById;
const getDriverTrips = async (driverId, vendorId) => {
    await (0, exports.getDriverById)(driverId, vendorId);
    return prisma_1.prisma.trip.findMany({ where: { driverId, vendorId } });
};
exports.getDriverTrips = getDriverTrips;
const getDriverBalance = async (driverId, vendorId) => {
    await (0, exports.getDriverById)(driverId, vendorId);
    const trips = await prisma_1.prisma.trip.findMany({
        where: { driverId, vendorId, isSettled: false, status: 'COMPLETED' },
    });
    const balance = trips.reduce((acc, t) => acc + Number(t.totalCollected || 0), 0);
    return { balance, pendingTrips: trips.length };
};
exports.getDriverBalance = getDriverBalance;
const updateDriver = async (driverId, vendorId, data) => {
    await (0, exports.getDriverById)(driverId, vendorId);
    return prisma_1.prisma.user.update({
        where: { id: driverId },
        data: {
            name: data.name,
            phone: data.phone,
            vehicleNo: data.vehicleNo
        },
        select: { id: true, name: true, email: true, phone: true, vehicleNo: true }
    });
};
exports.updateDriver = updateDriver;
const updateDriverPassword = async (driverId, vendorId, password) => {
    await (0, exports.getDriverById)(driverId, vendorId);
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    return prisma_1.prisma.user.update({
        where: { id: driverId },
        data: { password: hashedPassword }
    });
};
exports.updateDriverPassword = updateDriverPassword;
const deleteDriver = async (driverId, vendorId) => {
    await (0, exports.getDriverById)(driverId, vendorId);
    // Delete all stops related to driver's trips, then trips, then driver
    const trips = await prisma_1.prisma.trip.findMany({ where: { driverId } });
    const tripIds = trips.map(t => t.id);
    await prisma_1.prisma.routeStopBox.deleteMany({ where: { stop: { tripId: { in: tripIds } } } });
    await prisma_1.prisma.routeStop.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma_1.prisma.settlement.deleteMany({ where: { tripId: { in: tripIds } } });
    await prisma_1.prisma.trip.deleteMany({ where: { driverId } });
    return prisma_1.prisma.user.delete({ where: { id: driverId } });
};
exports.deleteDriver = deleteDriver;
