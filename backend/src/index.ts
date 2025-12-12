import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { runMigrations } from './db/migrations.js';
import { manualMigration } from './db/manualMigration.js';
import { query } from './db/connection.js';

// Routes
import authRoutes from './routes/auth.js';
import placesRoutes from './routes/places.js';
import citiesRoutes from './routes/cities.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket connection handling
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  connectedClients.add(ws);

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'subscribe':
          // Client subscribing to updates
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    connectedClients.delete(ws);
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast alert to all connected clients
export function broadcastAlert(alert: Record<string, any>) {
  const message = JSON.stringify({
    type: 'alert:new',
    data: alert,
  });
  
  connectedClients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Broadcast report verification result
export function broadcastReportUpdate(report: Record<string, any>) {
  const message = JSON.stringify({
    type: 'report:updated',
    data: report,
  });
  
  connectedClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('🔄 Initializing database...');
    await runMigrations();
    
    console.log('🔄 Running manual migrations...');
    await manualMigration();
    
    const PORT = parseInt(process.env.PORT || '3000');
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
