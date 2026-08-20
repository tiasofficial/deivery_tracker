import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst({
    include: { 
      stops: { 
        include: { 
          boxes: { include: { boxType: true } }, 
          merchant: true 
        } 
      }
    }
  });
  console.log('Trip stops JSON structure:');
  console.log(JSON.stringify(trip?.stops, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
