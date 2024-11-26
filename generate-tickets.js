import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import initSqlJs from 'sql.js';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

async function generateTickets() {
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    
    // Initialize database
    db.run(`
      CREATE TABLE tickets (
        id TEXT PRIMARY KEY,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await mkdir('tickets', { recursive: true });
    
    const stmt = db.prepare('INSERT INTO tickets (id) VALUES (?)');
    
    for (let i = 0; i < 250; i++) {
      const ticketId = nanoid(10);
      const qrPath = path.join('tickets', `ticket-${i + 1}.png`);
      
      // Generate QR code
      await QRCode.toFile(qrPath, ticketId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      
      // Save ticket to database
      stmt.run([ticketId]);
      console.log(`Generated ticket ${i + 1}/250`);
    }
    
    // Save the database to a file
    const data = db.export();
    await writeFile('tickets.db', Buffer.from(data));
    
    console.log('\nAll tickets generated successfully!');
    console.log('You can find the QR codes in the "tickets" folder');
    
  } catch (error) {
    console.error('Error generating tickets:', error);
  }
}

generateTickets();