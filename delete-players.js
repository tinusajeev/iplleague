import mysql from 'mysql2/promise';

async function run() {
  try {
    const db = await mysql.createPool({
      host: 'vxq.zmk.mybluehost.me',
      user: 'vxqzmkmy_ipltracker',
      password: 'SaturnDream14!',
      database: 'vxqzmkmy_ipltracker',
    });
    const [result] = await db.query('DELETE FROM players WHERE id IN (11, 12, 13)');
    console.log('Deleted players:', result.affectedRows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
