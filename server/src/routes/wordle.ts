import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const router = Router();

// Cargar palabras desde archivos
let WORDLE_WORDS: string[] = []; // Palabras objetivo (spanish.json)
let ALL_VALID_WORDS: Set<string> = new Set(); // Todas las palabras válidas (spanish.txt)

// Función para normalizar palabras (quitar tildes)
const normalizeWord = (word: string): string => {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};

// Inicializar palabras
try {
  // Cargar palabras objetivo desde JSON
  const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
  const jsonData = readFileSync(jsonPath, 'utf-8');
  const allWords = JSON.parse(jsonData);
  

  WORDLE_WORDS = allWords
    .map((word: string) => normalizeWord(word))
  
  console.log(`✅ Loaded ${WORDLE_WORDS.length} target words from JSON`);
  
  // Cargar todas las palabras válidas desde TXT
  const txtPath = join(process.cwd(), 'resources', 'spanish.txt');
  const txtData = readFileSync(txtPath, 'utf-8');
  
  txtData
    .split('\n')
    .map(word => normalizeWord(word.trim()))
    .forEach(word => ALL_VALID_WORDS.add(word));
  
  console.log(`✅ Loaded ${ALL_VALID_WORDS.size} valid words from TXT`);
  
} catch (error) {
  console.error('❌ Error loading word files:', error);
  // Fallback
  WORDLE_WORDS = ['GATOS', 'PERRO', 'CASAS', 'LIBRO', 'MUNDO'];
  WORDLE_WORDS.forEach(word => ALL_VALID_WORDS.add(word));
}

// GET /api/wordle/word - Obtener palabra aleatoria
router.get('/word', (req, res) => {
  if (WORDLE_WORDS.length === 0) {
    return res.status(500).json({ error: 'No words available' });
  }
  
  const randomIndex = randomInt(0, WORDLE_WORDS.length);
  const word = WORDLE_WORDS[randomIndex];
  
  console.log(`🎯 Selected word: ${word}`);
  
  res.json({ word });
});

// POST /api/wordle/check-word - Verificar si una palabra es válida
router.post('/check-word', (req, res) => {
  const { word } = req.body;
  
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid word' });
  }
  
  const normalizedWord = normalizeWord(word);
  
  if (normalizedWord.length !== 5) {
    return res.status(400).json({ 
      error: 'Word must be 5 letters',
      isValid: false 
    });
  }
  
  const isValid = ALL_VALID_WORDS.has(normalizedWord);
  
  console.log(`🔍 Checking word: ${word} -> ${normalizedWord} = ${isValid ? 'VALID' : 'INVALID'}`);
  
  res.json({ 
    isValid, 
    word: normalizedWord 
  });
});

// POST /api/wordle/validate - Validar guess contra palabra objetivo
router.post('/validate', (req, res) => {
  const { guess, word } = req.body;
  
  if (!guess || !word) {
    return res.status(400).json({ error: 'Missing guess or word' });
  }
  
  const normalizedGuess = normalizeWord(guess);
  const normalizedWord = normalizeWord(word);
  
  if (normalizedGuess.length !== 5 || normalizedWord.length !== 5) {
    return res.status(400).json({ error: 'Words must be 5 letters' });
  }
  
  // Verificar que la palabra adivinada sea válida
  const isValid = ALL_VALID_WORDS.has(normalizedGuess);
  
  // Evaluar cada letra
  const evaluation = normalizedGuess.split('').map((letter, index) => {
    if (normalizedWord[index] === letter) {
      return 'correct';
    } else if (normalizedWord.includes(letter)) {
      // Contar ocurrencias para manejar letras repetidas correctamente
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
  
  console.log(`✓ Validated: ${normalizedGuess} vs ${normalizedWord} = ${isCorrect ? 'CORRECT' : 'WRONG'}`);
  
  res.json({
    evaluation,
    isCorrect,
    isValid
  });
});

// POST /api/wordle/result - Guardar resultado
router.post('/result', (req, res) => {
  const { word, attempts, won, playerId } = req.body;
  
  console.log(`📊 Game result:`, { 
    word, 
    attempts, 
    won, 
    playerId 
  });
  
  // Aquí podrías guardar en base de datos
  
  res.json({ 
    success: true, 
    message: 'Result saved' 
  });
});

export default router;