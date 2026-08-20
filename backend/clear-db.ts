import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database transactions and mock trips...');
  
  // Wipe out transaction tables
  await prisma.routeStopBox.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.trip.deleteMany();
  
  console.log('Mock transactions successfully deleted!');
  console.log('Registered user accounts (vendor, drivers) have been preserved.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
