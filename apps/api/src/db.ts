import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: config.isProduction ? ['error'] : ['error', 'warn'],
});

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

export async function verifyDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}
