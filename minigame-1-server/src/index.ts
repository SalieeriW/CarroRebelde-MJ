import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const app = express();
const port = process.env.PORT || 1234;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ============================================
// CARGAR PALABRAS
// ============================================

let ALL_WORDS: string[] = []; // Todas las palabras válidas (de spanish.txt)
let GAME_WORDS: string[] = []; // TODAS las palabras de spanish.json (SIN filtro de tamaño)

const normalizeWord = (word: string): string => {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

// Cargar spanish.txt (TODAS las palabras para validación)
try {
  const txtPath = join(process.cwd(), 'resources', 'spanish.txt');
  const txtData = readFileSync(txtPath, 'utf-8');
  
  ALL_WORDS = txtData
    .split('\n')
    .map(word => normalizeWord(word.trim()))
    .filter(word => word.length > 0);
  
  console.log(`✅ Loaded ${ALL_WORDS.length} words from spanish.txt (for validation)`);
} catch (error) {
  console.error('❌ Error loading spanish.txt:', error);
  ALL_WORDS = [];
}

// Cargar spanish.json (TODAS las palabras - sin filtro de tamaño)
try {
  const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
  const jsonData = readFileSync(jsonPath, 'utf-8');
  const words = JSON.parse(jsonData);
  
  GAME_WORDS = words
    .map((word: string) => normalizeWord(word))
    .filter((word: string) => word.length > 0); // Solo eliminar vacías
  
  console.log(`✅ Loaded ${GAME_WORDS.length} game words from spanish.json (any length)`);
} catch (error) {
  console.error('❌ Error loading spanish.json:', error);
  console.log('⚠️  Using fallback words');
  GAME_WORDS = ['GATOS', 'PERRO', 'CASAS', 'LIBRO', 'MUNDO', 'FELIZ', 'AMIGO', 'COCHE', 'PLAYA'];
}

// Si spanish.txt no cargó, usar las palabras del juego como fallback
if (ALL_WORDS.length === 0) {
  ALL_WORDS = GAME_WORDS;
  console.log('⚠️  Using GAME_WORDS as ALL_WORDS fallback');
}

// ============================================
// WORDLE ENDPOINTS
// ============================================

// GET /api/wordle/word - Obtener palabra aleatoria de spanish.json (cualquier tamaño)
app.get('/api/wordle/word', (req, res) => {
  if (GAME_WORDS.length === 0) {
    return res.status(500).json({ error: 'No words available' });
  }
  
  const randomIndex = randomInt(0, GAME_WORDS.length);
  const word = GAME_WORDS[randomIndex];
  
  console.log(`🎯 Selected word: ${word} (length: ${word.length})`);
  res.json({ word });
});

// POST /api/wordle/check-word - Verificar si palabra es válida (contra spanish.txt)
app.post('/api/wordle/check-word', (req, res) => {
  const { word } = req.body;
  
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'Missing word', isValid: false });
  }
  
  const normalizedWord = normalizeWord(word);
  
  if (normalizedWord.length === 0) {
    return res.status(400).json({ error: 'Word cannot be empty', isValid: false });
  }
  
  // Verificar contra TODAS las palabras del diccionario (spanish.txt)
  const isValid = ALL_WORDS.includes(normalizedWord);
  
  console.log(`🔍 Check: ${word} -> ${normalizedWord} (${normalizedWord.length} letters) = ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);
  
  res.json({ isValid, word: normalizedWord });
});

// POST /api/wordle/validate - Validar guess contra palabra objetivo (cualquier tamaño)
app.post('/api/wordle/validate', (req, res) => {
  const { guess, word } = req.body;
  
  if (!guess || !word) {
    return res.status(400).json({ error: 'Missing guess or word' });
  }
  
  const normalizedGuess = normalizeWord(guess);
  const normalizedWord = normalizeWord(word);
  
  // Ya NO verificamos tamaño fijo - aceptamos cualquier tamaño
  if (normalizedGuess.length !== normalizedWord.length) {
    return res.status(400).json({ 
      error: `Guess length (${normalizedGuess.length}) must match word length (${normalizedWord.length})`
    });
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
  
  console.log(`✓ Validate: ${normalizedGuess} vs ${normalizedWord} (${normalizedWord.length} letters) = ${isCorrect ? 'CORRECT ✓' : 'WRONG ✗'}`);
  
  res.json({
    evaluation,
    isCorrect,
    isValid: ALL_WORDS.includes(normalizedGuess)
  });
});

// POST /api/wordle/result - Guardar resultado
app.post('/api/wordle/result', (req, res) => {
  const { word, attempts, won, playerId } = req.body;
  console.log(`📊 Game result:`, { word, attempts, won, playerId });
  res.json({ success: true, message: 'Result saved' });
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'wordle-1-server',
    validWords: ALL_WORDS.length,
    gameWords: GAME_WORDS.length,
    port: port
  });
});

// GET /stats - Estadísticas de palabras
app.get('/stats', (req, res) => {
  // Contar palabras por longitud
  const lengthStats: { [key: number]: number } = {};
  
  GAME_WORDS.forEach(word => {
    const len = word.length;
    lengthStats[len] = (lengthStats[len] || 0) + 1;
  });
  
  res.json({
    totalValidWords: ALL_WORDS.length,
    totalGameWords: GAME_WORDS.length,
    wordsByLength: lengthStats
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\n🎮 Wordle Server (Minigame 1)`);
  console.log(`📡 Running on: http://localhost:${port}`);
  console.log(`🔢 Port: ${port}`);
  console.log(`📚 Valid words (spanish.txt): ${ALL_WORDS.length}`);
  console.log(`🎯 Game words (spanish.json): ${GAME_WORDS.length} (any length)`);
  console.log(`✅ Ready!\n`);
});