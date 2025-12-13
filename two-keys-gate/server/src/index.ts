import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { createServer } from 'http';
import { TwoKeysRoom } from './rooms/TwoKeysRoom';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer
});

// Register TwoKeysRoom
gameServer.define('two_keys', TwoKeysRoom);
console.log('✓ TwoKeysRoom registered');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Two Keys Gate Server Running' });
});

gameServer.listen(port);
console.log(`🎮 Two Keys Gate Server running on http://localhost:${port}`);
