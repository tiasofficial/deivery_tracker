"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoxType = exports.updateBoxType = exports.createBoxType = exports.getBoxTypes = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getBoxTypes = async (vendorId) => {
    return prisma.boxType.findMany({ where: { vendorId } });
};
exports.getBoxTypes = getBoxTypes;
const createBoxType = async (vendorId, data) => {
    return prisma.boxType.create({ data: { ...data, vendorId } });
};
exports.createBoxType = createBoxType;
const updateBoxType = async (boxTypeId, vendorId, data) => {
    const box = await prisma.boxType.findUnique({ where: { id: boxTypeId } });
    if (!box || box.vendorId !== vendorId)
        throw new Error('Box type not found');
    return prisma.boxType.update({ where: { id: boxTypeId }, data });
};
exports.updateBoxType = updateBoxType;
const deleteBoxType = async (boxTypeId, vendorId) => {
    const box = await prisma.boxType.findUnique({ where: { id: boxTypeId } });
    if (!box || box.vendorId !== vendorId)
        throw new Error('Box type not found');
    return prisma.boxType.delete({ where: { id: boxTypeId } });
};
exports.deleteBoxType = deleteBoxType;
