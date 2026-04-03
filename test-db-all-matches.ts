import mysql from 'mysql2/promise';
async function run() {
  const db = await mysql.createPool({
    host: 'vxq.zmk.mybluehost.me',
    user: 'vxqzmkmy_ipltracker',
    password: 'SaturnDream14!',
    database: 'vxqzmkmy_ipltracker'
  });
  const [rows] = await db.query('SELECT id, matchLabel, date, matchDate FROM matches ORDER BY id DESC');
  console.log(rows);
  process.exit(0);
}
run();
