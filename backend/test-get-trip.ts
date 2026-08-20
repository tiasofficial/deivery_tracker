import { PrismaClient } from '@prisma/client';
import * as tripService from './src/services/trip.service';

const prisma = new PrismaClient();

async function main() {
  // Find the seeded driver and one of their trips
  const driver = await prisma.user.findFirst({ where: { email: 'driver1@test.com' } });
  if (!driver) {
    console.error('driver1@test.com not found');
    return;
  }

  const trip = await prisma.trip.findFirst({
    where: { driverId: driver.id }
  });

  if (!trip) {
    console.error('No trip found for driver');
    return;
  }

  console.log(`Testing tripService.getTripById for trip: ${trip.id}`);
  const result = await tripService.getTripById(trip.id, driver.id, 'DRIVER');
  
  console.log('Returned trip stops JSON:');
  console.log(JSON.stringify(result.stops, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
