import mysql from 'mysql2/promise';

async function alter() {
  const db = await mysql.createPool({
    host: 'vxq.zmk.mybluehost.me',
    user: 'vxqzmkmy_ipltracker',
    password: 'SaturnDream14!',
    database: 'vxqzmkmy_ipltracker',
  });
  try {
    await db.query('ALTER TABLE matches ADD COLUMN matchLabel VARCHAR(255)');
    await db.query('ALTER TABLE matches ADD COLUMN team1 VARCHAR(50)');
    await db.query('ALTER TABLE matches ADD COLUMN team2 VARCHAR(50)');
    console.log('Altered successfully');
  } catch(e) { 
    console.log('Error:', e.message); 
  }
  process.exit(0);
}
alter();
