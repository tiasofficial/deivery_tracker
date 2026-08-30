async function test() {
  try {
    const loginRes = await fetch('https://deivery-tracker-s0js.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver1@test.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('Got token');
    
    // Get trips
    const tripsRes = await fetch('https://deivery-tracker-s0js.onrender.com/api/trips', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tripsData = await tripsRes.json();
    const trip = tripsData.data[0];
    if (!trip) return console.log('No trips found');
    console.log('Testing trip:', trip.id, 'Current Fee:', trip.transportFee);
    
    // Patch complete
    const patchRes = await fetch(`https://deivery-tracker.onrender.com/api/trips/${trip.id}/complete`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ transportFee: 999.99 })
    });
    
    const patchData = await patchRes.json();
    console.log('Patch success:', patchData);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
