import express from 'express';
import initSqlJs from 'sql.js';
import { readFile, writeFile } from 'fs/promises';

const app = express();
const port = 3000;

let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  const buffer = await readFile('tickets.db');
  db = new SQL.Database(new Uint8Array(buffer));
}

app.use(express.json());

app.post('/validate', async (req, res) => {
  const { ticketId } = req.body;
  
  if (!ticketId) {
    return res.status(400).json({ error: 'Ticket ID is required' });
  }
  
  const ticket = db.exec('SELECT * FROM tickets WHERE id = ?', [ticketId])[0];
  
  if (!ticket || ticket.values.length === 0) {
    return res.status(404).json({ error: 'Invalid ticket' });
  }
  
  const isUsed = ticket.values[0][1] === 1;
  
  if (isUsed) {
    return res.status(400).json({ error: 'Ticket already used' });
  }
  
  // Mark ticket as used
  db.run('UPDATE tickets SET used = 1 WHERE id = ?', [ticketId]);
  
  // Save database changes
  const data = db.export();
  await writeFile('tickets.db', Buffer.from(data));
  
  res.json({ success: true, message: 'Ticket validated successfully' });
});

app.get('/stats', (req, res) => {
  const stats = {
    total: db.exec('SELECT COUNT(*) as count FROM tickets')[0].values[0][0],
    used: db.exec('SELECT COUNT(*) as count FROM tickets WHERE used = 1')[0].values[0][0]
  };
  
  res.json(stats);
});

// Initialize database before starting the server
initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Validation server running at http://localhost:${port}`);
  });
});