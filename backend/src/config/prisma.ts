import { PrismaClient } from '@prisma/client';

// Single shared client instance prevents connection exhaustion
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
