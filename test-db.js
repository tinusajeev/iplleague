import mysql from 'mysql2/promise';
async function test() {
  const db = await mysql.createPool({
    host: 'vxq.zmk.mybluehost.me',
    user: 'vxqzmkmy_ipltracker',
    password: 'SaturnDream14!',
    database: 'vxqzmkmy_ipltracker',
  });
  try {
    const [rows] = await db.query('DESCRIBE matches');
    console.log(rows);
  } catch(e) { console.error(e); }
  process.exit(0);
}
test();
