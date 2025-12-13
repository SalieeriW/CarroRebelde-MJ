import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { createServer } from 'http';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
});

// Aquí defines tus rooms de Colyseus
// gameServer.define('room_name', YourRoomClass);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
