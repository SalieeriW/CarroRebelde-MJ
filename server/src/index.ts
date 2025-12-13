import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { createServer } from 'http';
import { MinigameRoom } from './rooms/MinigameRoom';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
});

// Store room info in memory (roomCode -> roomId mapping)
interface MinigameRoomInfo {
  roomId: string;
  roomCode: string;
  minigameId: number;
  players: number;
}

const activeMinigameRooms = new Map<string, MinigameRoomInfo>();

// Define the minigame room
gameServer.define('minigame_room', MinigameRoom)
  .enableRealtimeListing();

// Export activeMinigameRooms for MinigameRoom to use
(global as any).activeMinigameRooms = activeMinigameRooms;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint to find room by code
app.get('/rooms/:roomCode', (req, res) => {
  try {
    const roomCode = req.params.roomCode.toUpperCase();
    const roomInfo = activeMinigameRooms.get(roomCode);
    
    if (roomInfo) {
      res.json(roomInfo);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to list all active rooms
app.get('/rooms', (req, res) => {
  try {
    const roomList = Array.from(activeMinigameRooms.values())
      .filter(room => room.players < 2)
      .map(room => ({
        roomId: room.roomId,
        roomCode: room.roomCode,
        minigameId: room.minigameId,
        players: room.players,
        maxPlayers: 2,
      }));
    
    res.json(roomList);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.json([]);
  }
});

httpServer.listen(port, () => {
  console.log(`\n🎮 Minigames Server running!`);
  console.log(`📡 WebSocket: ws://localhost:${port}`);
  console.log(`🌐 HTTP: http://localhost:${port}\n`);
});
