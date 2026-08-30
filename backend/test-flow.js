const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullFlow() {
  try {
    const loginRes = await fetch('https://deivery-tracker-s0js.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vendor@test.com', password: 'password123' })
    });
    const { data: { token: vendorToken, user: vendor } } = await loginRes.json();

    const driverLoginRes = await fetch('https://deivery-tracker-s0js.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver1@test.com', password: 'password123' })
    });
    const { data: { token: driverToken, user: driver } } = await driverLoginRes.json();

    const createRes = await fetch('https://deivery-tracker.onrender.com/api/trips', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vendorToken}` 
      },
      body: JSON.stringify({
        driverId: driver.id,
        tripDate: new Date().toISOString(),
        transportFee: 0,
        notes: 'Test trip for transport fee bug',
        stops: [{ merchantName: 'Test Merchant', stopOrder: 1, boxes: [{ boxName: 'Test Box', quantity: 2 }] }]
      })
    });
    const { data: newTrip } = await createRes.json();
    console.log('Created trip:', newTrip.id);

    await fetch(`https://deivery-tracker.onrender.com/api/trips/${newTrip.id}/start`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` }
    });

    const stopId = newTrip.stops[0].id;
    await fetch(`https://deivery-tracker.onrender.com/api/trips/${newTrip.id}/stops/${stopId}/collect`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}` 
      },
      body: JSON.stringify({ amount: 1500 })
    });

    const completeRes = await fetch(`http://localhost:4000/api/trips/${newTrip.id}/complete`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}` 
      },
      body: JSON.stringify({ transportFee: 350 })
    });
    const { data: completedTrip } = await completeRes.json();
    console.log('Live API returned transportFee:', completedTrip.transportFee);

    const dbTrip = await prisma.trip.findUnique({ where: { id: newTrip.id } });
    console.log('DB shows transportFee:', dbTrip.transportFee);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    prisma.$disconnect();
  }
}

fullFlow();
