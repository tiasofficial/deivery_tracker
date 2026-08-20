import { PrismaClient } from '@prisma/client';

import { env } from './env';

let url = process.env.DATABASE_URL || env.databaseUrl;
if (url && !url.includes('connection_limit')) {
  url = url.includes('?') ? `${url}&connection_limit=5` : `${url}?connection_limit=5`;
}
if (url && !url.includes('pool_timeout')) {
  url = `${url}&pool_timeout=30`;
}

// Single shared client instance prevents connection exhaustion
export const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url,
    },
  },
});
