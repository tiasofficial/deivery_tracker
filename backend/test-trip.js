const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst();
  if (!trip) return console.log('No trip found');
  
  const updated = await prisma.trip.update({
    where: { id: trip.id },
    data: {
      status: 'COMPLETED',
      transportFee: 123.45,
    }
  });
  console.log('Updated trip:', updated.id, 'Fee:', updated.transportFee);
}

main().catch(console.error).finally(() => prisma.$disconnect());
