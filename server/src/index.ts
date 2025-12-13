import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { createServer } from 'http';
import { MinigameRoom } from './rooms/MinigameRoom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
});

interface MinigameRoomInfo {
  roomId: string;
  roomCode: string;
  minigameId: number;
  players: number;
}

const activeMinigameRooms = new Map<string, MinigameRoomInfo>();

gameServer.define('minigame_room', MinigameRoom)
  .enableRealtimeListing();

(global as any).activeMinigameRooms = activeMinigameRooms;

// ============================================
// WORDLE - CARGAR PALABRAS
// ============================================

let ALL_WORDS: string[] = [];

const normalizeWord = (word: string): string => {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

try {
  const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
  const jsonData = readFileSync(jsonPath, 'utf-8');
  const words = JSON.parse(jsonData);
  
  ALL_WORDS = words
    .map((word: string) => normalizeWord(word))
    .filter((word: string) => word.length === 5);
  
  console.log(`✅ Loaded ${ALL_WORDS.length} words`);
} catch (error) {
  console.error('❌ Error loading words:', error);
  ALL_WORDS = ['GATOS', 'PERRO', 'CASAS', 'LIBRO', 'MUNDO', 'FELIZ', 'AMIGO'];
}

// ============================================
// WORDLE ENDPOINTS
// ============================================

// Obtener palabra aleatoria
app.get('/api/wordle/word', (req, res) => {
  if (ALL_WORDS.length === 0) {
    return res.status(500).json({ error: 'No words available' });
  }
  
  const randomIndex = randomInt(0, ALL_WORDS.length);
  const word = ALL_WORDS[randomIndex];
  
  console.log(`🎯 Selected word: ${word}`);
  res.json({ word });
});

// Verificar si palabra es válida (ACEPTA CUALQUIER PALABRA DE spanish.json)
app.post('/api/wordle/check-word', (req, res) => {
  const { word } = req.body;
  
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'Missing word', isValid: false });
  }
  
  const normalizedWord = normalizeWord(word);
  
  if (normalizedWord.length !== 5) {
    return res.status(400).json({ error: 'Word must be 5 letters', isValid: false });
  }
  
  // ACEPTA CUALQUIER PALABRA QUE ESTÉ EN spanish.json
  const isValid = ALL_WORDS.includes(normalizedWord);
  
  console.log(`🔍 Check: ${word} -> ${normalizedWord} = ${isValid ? 'VALID' : 'INVALID'}`);
  
  res.json({ isValid, word: normalizedWord });
});

// Validar guess contra palabra objetivo
app.post('/api/wordle/validate', (req, res) => {
  const { guess, word } = req.body;
  
  if (!guess || !word) {
    return res.status(400).json({ error: 'Missing guess or word' });
  }
  
  const normalizedGuess = normalizeWord(guess);
  const normalizedWord = normalizeWord(word);
  
  if (normalizedGuess.length !== 5 || normalizedWord.length !== 5) {
    return res.status(400).json({ error: 'Words must be 5 letters' });
  }
  
  // Evaluar cada letra
  const evaluation = normalizedGuess.split('').map((letter, index) => {
    if (normalizedWord[index] === letter) {
      return 'correct';
    } else if (normalizedWord.includes(letter)) {
      const letterCount = normalizedWord.split('').filter(l => l === letter).length;
      const correctCount = normalizedWord.split('').filter((l, i) => 
        l === letter && normalizedGuess[i] === letter
      ).length;
      const presentCount = normalizedGuess.split('').filter((l, i) => 
        l === letter && normalizedWord[i] !== letter && i < index
      ).length;
      
      if (presentCount < letterCount - correctCount) {
        return 'present';
      }
    }
    return 'absent';
  });
  
  const isCorrect = normalizedGuess === normalizedWord;
  
  console.log(`✓ Validate: ${normalizedGuess} vs ${normalizedWord} = ${isCorrect ? 'CORRECT' : 'WRONG'}`);
  
  res.json({
    evaluation,
    isCorrect,
    isValid: ALL_WORDS.includes(normalizedGuess)
  });
});

// Guardar resultado
app.post('/api/wordle/result', (req, res) => {
  const { word, attempts, won, playerId } = req.body;
  console.log(`📊 Result:`, { word, attempts, won, playerId });
  res.json({ success: true, message: 'Result saved' });
});

// ============================================
// ROOM ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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