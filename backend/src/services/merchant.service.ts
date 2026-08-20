import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getMerchants = async (vendorId: string) => {
  return prisma.merchant.findMany({ where: { vendorId } });
};

export const createMerchant = async (vendorId: string, data: any) => {
  return prisma.merchant.create({
    data: { ...data, vendorId },
  });
};

export const updateMerchant = async (merchantId: string, vendorId: string, data: any) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant || merchant.vendorId !== vendorId) throw new Error('Merchant not found');
  
  return prisma.merchant.update({
    where: { id: merchantId },
    data,
  });
};

export const deleteMerchant = async (merchantId: string, vendorId: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant || merchant.vendorId !== vendorId) throw new Error('Merchant not found');
  
  return prisma.merchant.delete({ where: { id: merchantId } });
};

export const getMerchantHistory = async (merchantId: string, vendorId: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant || merchant.vendorId !== vendorId) throw new Error('Merchant not found');
  
  return prisma.routeStop.findMany({
    where: { merchantId },
    include: { trip: true, boxes: { include: { boxType: true } } },
    orderBy: { createdAt: 'desc' },
  });
};
