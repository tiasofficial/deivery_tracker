"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBoxType = exports.updateBoxType = exports.createBoxType = exports.getBoxTypes = void 0;
const prisma_1 = require("../config/prisma");
const getBoxTypes = async (vendorId) => {
    return prisma_1.prisma.boxType.findMany({ where: { vendorId } });
};
exports.getBoxTypes = getBoxTypes;
const createBoxType = async (vendorId, data) => {
    return prisma_1.prisma.boxType.create({ data: { ...data, vendorId } });
};
exports.createBoxType = createBoxType;
const updateBoxType = async (boxTypeId, vendorId, data) => {
    const box = await prisma_1.prisma.boxType.findUnique({ where: { id: boxTypeId } });
    if (!box || box.vendorId !== vendorId)
        throw new Error('Box type not found');
    return prisma_1.prisma.boxType.update({ where: { id: boxTypeId }, data });
};
exports.updateBoxType = updateBoxType;
const deleteBoxType = async (boxTypeId, vendorId) => {
    const box = await prisma_1.prisma.boxType.findFirst({
        where: {
            OR: [{ id: boxTypeId }, { name: boxTypeId }],
            vendorId
        }
    });
    if (!box)
        throw new Error('Box type not found');
    try {
        await prisma_1.prisma.routeStopBox.deleteMany({ where: { boxTypeId: box.id } });
    }
    catch (e) { }
    return prisma_1.prisma.boxType.delete({ where: { id: box.id } });
};
exports.deleteBoxType = deleteBoxType;
