import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.routeStopBox.deleteMany();
  await prisma.routeStop.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.boxType.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');
  const hashedPassword = await bcrypt.hash('password123', 10);


  const vendor = await prisma.user.create({
    data: {
      name: 'Main Vendor',
      email: 'vendor@test.com',
      password: hashedPassword,
      role: Role.VENDOR,
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      name: 'Driver One',
      email: 'driver1@test.com',
      password: hashedPassword,
      role: Role.DRIVER,
      vendorId: vendor.id,
      vehicleNo: 'KA-01-1234',
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      name: 'Driver Two',
      email: 'driver2@test.com',
      password: hashedPassword,
      role: Role.DRIVER,
      vendorId: vendor.id,
      vehicleNo: 'KA-02-5678',
    },
  });

  const merchantA = await prisma.merchant.create({
    data: { name: 'Merchant A', address: '123 Main St', vendorId: vendor.id },
  });
  const merchantB = await prisma.merchant.create({
    data: { name: 'Merchant B', address: '456 Side St', vendorId: vendor.id },
  });
  const merchantC = await prisma.merchant.create({
    data: { name: 'Merchant C', address: '789 High St', vendorId: vendor.id },
  });

  const box1 = await prisma.boxType.create({
    data: { name: 'Bata Box', vendorId: vendor.id },
  });
  const box2 = await prisma.boxType.create({
    data: { name: 'Nirmal Box', vendorId: vendor.id },
  });
  const box3 = await prisma.boxType.create({
    data: { name: 'Bala Box', vendorId: vendor.id },
  });

  const trip1 = await prisma.trip.create({
    data: {
      vendorId: vendor.id,
      driverId: driver1.id,
      tripDate: new Date(),
      transportFee: 500.00,
      stops: {
        create: [
          {
            merchantId: merchantA.id,
            stopOrder: 1,
            boxes: {
              create: [
                { boxTypeId: box1.id, quantity: 10 },
                { boxTypeId: box2.id, quantity: 5 },
              ],
            },
          },
          {
            merchantId: merchantB.id,
            stopOrder: 2,
            boxes: {
              create: [
                { boxTypeId: box3.id, quantity: 20 },
              ],
            },
          },
        ],
      },
    },
  });
  
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
