const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrip() {
  const trip = await prisma.trip.findUnique({
    where: { id: '5d569152-a477-4e75-bbc4-b06d9b77ddad' }
  });
  console.log('DB Trip Data:', trip);
}

checkTrip().finally(() => prisma.$disconnect());
