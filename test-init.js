import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function initDB() {
  let db;
  try {
    console.log('Trying MySQL...');
    db = await mysql.createPool({
      host: 'vxq.zmk.mybluehost.me',
      user: 'vxqzmkmy_ipltracker',
      password: 'SaturnDream14!',
      database: 'vxqzmkmy_ipltracker',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });
    await db.query('SELECT 1');
    console.log('MySQL connected');
  } catch (error) {
    console.log('MySQL failed, trying SQLite...', error.message);
    try {
      db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
      });
      console.log('SQLite connected');
    } catch (e) {
      console.error('SQLite failed too:', e);
    }
  }
}

initDB();
