"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMerchantHistory = exports.deleteMerchant = exports.updateMerchant = exports.createMerchant = exports.getMerchants = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getMerchants = async (vendorId) => {
    return prisma.merchant.findMany({ where: { vendorId } });
};
exports.getMerchants = getMerchants;
const createMerchant = async (vendorId, data) => {
    return prisma.merchant.create({
        data: { ...data, vendorId },
    });
};
exports.createMerchant = createMerchant;
const updateMerchant = async (merchantId, vendorId, data) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.vendorId !== vendorId)
        throw new Error('Merchant not found');
    return prisma.merchant.update({
        where: { id: merchantId },
        data,
    });
};
exports.updateMerchant = updateMerchant;
const deleteMerchant = async (merchantId, vendorId) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.vendorId !== vendorId)
        throw new Error('Merchant not found');
    return prisma.merchant.delete({ where: { id: merchantId } });
};
exports.deleteMerchant = deleteMerchant;
const getMerchantHistory = async (merchantId, vendorId) => {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.vendorId !== vendorId)
        throw new Error('Merchant not found');
    return prisma.routeStop.findMany({
        where: { merchantId },
        include: { trip: true, boxes: { include: { boxType: true } } },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getMerchantHistory = getMerchantHistory;
