import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

app.use(express.json());

// Prevent caching for all API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const ADMIN_PIN = process.env.ADMIN_PIN || 'IPL2025';

app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid PIN' });
  }
});

const requireAdmin = (req: any, res: any, next: any) => {
  const pin = req.headers['x-admin-pin'];
  if (pin === ADMIN_PIN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Database setup
let db: any;

async function initDB() {
  db = await mysql.createPool({
    host: 'vxq.zmk.mybluehost.me',
    user: 'vxqzmkmy_ipltracker',
    password: 'SaturnDream14!',
    database: 'vxqzmkmy_ipltracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  try {
    // Test connection
    await db.query('SELECT 1');
    console.log('Connected to Bluehost MySQL database.');
    
    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS players (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        totalPoints INT DEFAULT 0,
        matchesPlaced INT DEFAULT 0
      )
    `);
    
    try { await db.query('ALTER TABLE players ADD COLUMN avatar MEDIUMTEXT'); } catch (e) {}
    try { await db.query('ALTER TABLE players ADD COLUMN totalDream11Points FLOAT DEFAULT 0'); } catch (e) {}
    try { await db.query('ALTER TABLE players ADD COLUMN matchesPlayed INT DEFAULT 0'); } catch (e) {}
    try { await db.query('ALTER TABLE matches ADD COLUMN playerScores TEXT'); } catch (e) {}
    try { await db.query('ALTER TABLE matches ADD COLUMN extraPlaceId INT'); } catch (e) {}
    try { await db.query('ALTER TABLE matches ADD COLUMN extraPlacePosition INT'); } catch (e) {}
    try { await db.query('ALTER TABLE matches ADD FOREIGN KEY (extraPlaceId) REFERENCES players(id)'); } catch (e) {}
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id INT PRIMARY KEY AUTO_INCREMENT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        matchDate DATE,
        matchLabel VARCHAR(255),
        team1 VARCHAR(50),
        team2 VARCHAR(50),
        firstPlaceId INT,
        secondPlaceId INT,
        thirdPlaceId INT,
        FOREIGN KEY (firstPlaceId) REFERENCES players(id),
        FOREIGN KEY (secondPlaceId) REFERENCES players(id),
        FOREIGN KEY (thirdPlaceId) REFERENCES players(id)
      )
    `);

    // Seed players if empty
    const [rows]: any = await db.query('SELECT COUNT(*) as count FROM players');
    if (rows[0].count === 0) {
      for (let i = 1; i <= 13; i++) {
        await db.query('INSERT INTO players (name) VALUES (?)', [`Player ${i}`]);
      }
    }
  } catch (error: any) {
    console.error('Failed to initialize database tables, but pool is created:', error.message);
  }
}

// API Routes
app.get('/api/players', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM matches WHERE firstPlaceId = p.id OR (extraPlaceId = p.id AND extraPlacePosition = 1)) as firstPlaces,
        (SELECT COUNT(*) FROM matches WHERE secondPlaceId = p.id OR (extraPlaceId = p.id AND extraPlacePosition = 2)) as secondPlaces,
        (SELECT COUNT(*) FROM matches WHERE thirdPlaceId = p.id OR (extraPlaceId = p.id AND extraPlacePosition = 3)) as thirdPlaces
      FROM players p 
      ORDER BY p.totalPoints DESC, p.matchesPlaced DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.put('/api/players/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, avatar } = req.body;
  try {
    if (avatar !== undefined) {
      await db.query('UPDATE players SET name = ?, avatar = ? WHERE id = ?', [name, avatar, id]);
    } else {
      await db.query('UPDATE players SET name = ? WHERE id = ?', [name, id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

app.post('/api/players', requireAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const [result]: any = await db.query('INSERT INTO players (name, totalDream11Points, matchesPlayed) VALUES (?, 0, 0)', [name || 'New Player']);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Failed to add player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

app.delete('/api/players/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    // Check if player has matches
    const [matches]: any = await db.query('SELECT id FROM matches WHERE firstPlaceId = ? OR secondPlaceId = ? OR thirdPlaceId = ? OR extraPlaceId = ? LIMIT 1', [id, id, id, id]);
    if (matches.length > 0) {
      return res.status(400).json({ error: 'Cannot delete player with existing matches. Remove their matches first.' });
    }
    await db.query('DELETE FROM players WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Draft storage
let matchDraft: any = null;

app.get('/api/draft', (req, res) => {
  res.json(matchDraft || {});
});

app.post('/api/draft', (req, res) => {
  matchDraft = req.body;
  res.json({ success: true });
});

app.delete('/api/draft', (req, res) => {
  matchDraft = null;
  res.json({ success: true });
});

app.post('/api/matches', requireAdmin, async (req, res) => {
  const { matchLabel, team1, team2, matchDate, firstPlaceId, secondPlaceId, thirdPlaceId, extraPlaceId, extraPlacePosition, playerScores } = req.body;
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query(
        'INSERT INTO matches (matchLabel, team1, team2, matchDate, firstPlaceId, secondPlaceId, thirdPlaceId, extraPlaceId, extraPlacePosition, playerScores) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [matchLabel, team1, team2, matchDate, firstPlaceId, secondPlaceId, thirdPlaceId, extraPlaceId || null, extraPlacePosition || null, playerScores ? JSON.stringify(playerScores) : null]
      );
      await connection.query('UPDATE players SET totalPoints = COALESCE(totalPoints, 0) + 3, matchesPlaced = COALESCE(matchesPlaced, 0) + 1 WHERE id = ?', [firstPlaceId]);
      await connection.query('UPDATE players SET totalPoints = COALESCE(totalPoints, 0) + 2, matchesPlaced = COALESCE(matchesPlaced, 0) + 1 WHERE id = ?', [secondPlaceId]);
      await connection.query('UPDATE players SET totalPoints = COALESCE(totalPoints, 0) + 1, matchesPlaced = COALESCE(matchesPlaced, 0) + 1 WHERE id = ?', [thirdPlaceId]);
      
      if (extraPlaceId && extraPlacePosition) {
        const points = extraPlacePosition === 1 ? 3 : extraPlacePosition === 2 ? 2 : 1;
        await connection.query('UPDATE players SET totalPoints = COALESCE(totalPoints, 0) + ?, matchesPlaced = COALESCE(matchesPlaced, 0) + 1 WHERE id = ?', [points, extraPlaceId]);
      }
      
      if (playerScores) {
        for (const [playerId, score] of Object.entries(playerScores)) {
          const numScore = parseFloat(score as string);
          if (!isNaN(numScore)) {
            const playedIncrement = numScore !== 0 ? 1 : 0;
            await connection.query('UPDATE players SET totalDream11Points = COALESCE(totalDream11Points, 0) + ?, matchesPlayed = COALESCE(matchesPlayed, 0) + ? WHERE id = ?', [numScore, playedIncrement, parseInt(playerId)]);
          }
        }
      }
      
      await connection.commit();
      connection.release();
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add match:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add match' });
  }
});

app.delete('/api/matches/:id', requireAdmin, async (req, res) => {
  const matchId = parseInt(req.params.id);
  console.log(`Attempting to delete match with ID: ${matchId}`);
  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
      const [rows]: any = await connection.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      console.log(`Found match rows:`, rows);
      if (!rows || rows.length === 0) throw new Error('Match not found');
      const match = rows[0];

      await connection.query('UPDATE players SET totalPoints = GREATEST(0, COALESCE(totalPoints, 0) - 3), matchesPlaced = GREATEST(0, COALESCE(matchesPlaced, 0) - 1) WHERE id = ?', [match.firstPlaceId]);
      await connection.query('UPDATE players SET totalPoints = GREATEST(0, COALESCE(totalPoints, 0) - 2), matchesPlaced = GREATEST(0, COALESCE(matchesPlaced, 0) - 1) WHERE id = ?', [match.secondPlaceId]);
      await connection.query('UPDATE players SET totalPoints = GREATEST(0, COALESCE(totalPoints, 0) - 1), matchesPlaced = GREATEST(0, COALESCE(matchesPlaced, 0) - 1) WHERE id = ?', [match.thirdPlaceId]);
      
      if (match.extraPlaceId && match.extraPlacePosition) {
        const points = match.extraPlacePosition === 1 ? 3 : match.extraPlacePosition === 2 ? 2 : 1;
        await connection.query('UPDATE players SET totalPoints = GREATEST(0, COALESCE(totalPoints, 0) - ?), matchesPlaced = GREATEST(0, COALESCE(matchesPlaced, 0) - 1) WHERE id = ?', [points, match.extraPlaceId]);
      }
      
      if (match.playerScores) {
        let scores = match.playerScores;
        if (typeof scores === 'string') {
          try { scores = JSON.parse(scores); } catch (e) {}
        }
        if (typeof scores === 'object' && scores !== null) {
          for (const [playerId, score] of Object.entries(scores)) {
            const numScore = parseFloat(score as string);
            if (!isNaN(numScore)) {
              const playedDecrement = numScore !== 0 ? 1 : 0;
              await connection.query('UPDATE players SET totalDream11Points = COALESCE(totalDream11Points, 0) - ?, matchesPlayed = GREATEST(0, COALESCE(matchesPlayed, 0) - ?) WHERE id = ?', [numScore, playedDecrement, parseInt(playerId)]);
            }
          }
        }
      }
      
      await connection.query('DELETE FROM matches WHERE id = ?', [matchId]);
      
      await connection.commit();
      connection.release();
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete match:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete match' });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.date, m.matchDate, m.matchLabel, m.team1, m.team2, m.playerScores,
             p1.name as firstName, p1.avatar as firstAvatar,
             p2.name as secondName, p2.avatar as secondAvatar,
             p3.name as thirdName, p3.avatar as thirdAvatar,
             p4.name as extraName, p4.avatar as extraAvatar,
             m.extraPlacePosition
      FROM matches m
      LEFT JOIN players p1 ON m.firstPlaceId = p1.id
      LEFT JOIN players p2 ON m.secondPlaceId = p2.id
      LEFT JOIN players p3 ON m.thirdPlaceId = p3.id
      LEFT JOIN players p4 ON m.extraPlaceId = p4.id
      ORDER BY COALESCE(m.matchDate, m.date) DESC, m.id DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

async function startServer() {
  await initDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
