import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getBoxTypes = async (vendorId: string) => {
  return prisma.boxType.findMany({ where: { vendorId } });
};

export const createBoxType = async (vendorId: string, data: any) => {
  return prisma.boxType.create({ data: { ...data, vendorId } });
};

export const updateBoxType = async (boxTypeId: string, vendorId: string, data: any) => {
  const box = await prisma.boxType.findUnique({ where: { id: boxTypeId } });
  if (!box || box.vendorId !== vendorId) throw new Error('Box type not found');
  
  return prisma.boxType.update({ where: { id: boxTypeId }, data });
};

export const deleteBoxType = async (boxTypeId: string, vendorId: string) => {
  const box = await prisma.boxType.findUnique({ where: { id: boxTypeId } });
  if (!box || box.vendorId !== vendorId) throw new Error('Box type not found');
  
  return prisma.boxType.delete({ where: { id: boxTypeId } });
};
