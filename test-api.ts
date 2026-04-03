import fetch from 'node-fetch';

async function test() {
  const adminPin = 'IPL2025';
  
  // 1. Add a match
  console.log('Adding match...');
  const addRes = await fetch('http://localhost:3000/api/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin
    },
    body: JSON.stringify({
      matchLabel: 'Test Match',
      team1: 'CSK',
      team2: 'MI',
      matchDate: '2025-04-01',
      firstPlaceId: 1,
      secondPlaceId: 2,
      thirdPlaceId: 3,
      extraPlaceId: null,
      extraPlacePosition: null,
      playerScores: {
        "1": 0,
        "2": 5.5,
        "3": -2
      }
    })
  });
  
  const addData = await addRes.json();
  console.log('Add match response:', addRes.status, addData);
  
  // 2. Get matches
  console.log('Getting matches...');
  const getRes = await fetch('http://localhost:3000/api/matches');
  const matches = await getRes.json();
  console.log('Matches count:', matches.length);
  
  const testMatch = matches.find((m: any) => m.matchLabel === 'Test Match');
  if (testMatch) {
    console.log('Found test match with ID:', testMatch.id);
    
    // 3. Delete match
    console.log('Deleting match...');
    const delRes = await fetch(`http://localhost:3000/api/matches/${testMatch.id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': adminPin
      }
    });
    const delData = await delRes.json();
    console.log('Delete match response:', delRes.status, delData);
  }
}

test().catch(console.error);
