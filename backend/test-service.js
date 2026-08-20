const { updateTripStatus } = require('./dist/services/trip.service');

async function testService() {
  try {
    const tripId = '5d569152-a477-4e75-bbc4-b06d9b77ddad';
    const driverId = 'dc30bd30-4312-4371-b01a-bd8193ff0210';
    
    console.log('Calling updateTripStatus...');
    const result = await updateTripStatus(tripId, driverId, 'COMPLETED', 150);
    console.log('Result fee:', result.transportFee);
  } catch (err) {
    console.error('Error:', err);
  }
}

testService();
