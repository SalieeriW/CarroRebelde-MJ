import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const app = express();
const port = process.env.PORT || 1234;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// --- CARGA DE PALABRAS (Igual que antes) ---
let ALL_WORDS: string[] = []; 
let GAME_WORDS: string[] = []; 

const normalizeWord = (word: string): string => {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
};

try {
  const txtPath = join(process.cwd(), 'resources', 'spanish.txt');
  ALL_WORDS = readFileSync(txtPath, 'utf-8').split('\n').map(w => normalizeWord(w)).filter(w => w.length > 0);
} catch (e) { console.error('Error loading spanish.txt'); ALL_WORDS = []; }

try {
  const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
  const words = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  GAME_WORDS = words.map((w: string) => normalizeWord(w)).filter((w: string) => w.length > 0);
} catch (e) { 
    GAME_WORDS = ['GATOS', 'PERRO', 'CASAS', 'LIBRO', 'COCHE', 'PLAYA'];
}
if (ALL_WORDS.length === 0) ALL_WORDS = GAME_WORDS;

// --- GESTIÓN DE SESIONES ---

interface WordleGuess {
    word: string;
    evaluation: string[];
}

interface GameSession {
    targetWord: string;
    guesses: WordleGuess[];
    status: 'playing' | 'won' | 'lost';
    stage: number; // 1, 2 o 3
    maxStages: number;
    lastActivity: number;
}

const sessions = new Map<string, GameSession>();
const MAX_ATTEMPTS = 6;
const TARGET_STAGES = 3; // NÚMERO DE PALABRAS A ACERTAR

// Helper para sacar palabra random
const getRandomWord = () => GAME_WORDS[randomInt(0, GAME_WORDS.length)];

// Limpieza automática
setInterval(() => {
    const now = Date.now();
    sessions.forEach((s, id) => { if (now - s.lastActivity > 3600000) sessions.delete(id); });
}, 600000);

// --- ENDPOINTS ---

app.get('/api/wordle/state/:sessionId', (req: Request, res: Response): any => {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
        if (GAME_WORDS.length === 0) return res.status(500).json({ error: 'No words' });
        const newWord = getRandomWord();
        sessions.set(sessionId, {
            targetWord: newWord,
            guesses: [],
            status: 'playing',
            stage: 1,
            maxStages: TARGET_STAGES,
            lastActivity: Date.now()
        });
        console.log(`🆕 Session ${sessionId}: Start Stage 1`);
        console.log(`👀 SOLUCIÓN (Stage 1): ${newWord}`); 
    }

    const session = sessions.get(sessionId)!;
        console.log(`👀 SOLUCIÓN (Stage 1): ${session.targetWord}`); 

    return res.json({
        wordLength: session.targetWord.length,
        guesses: session.guesses,
        status: session.status,
        stage: session.stage,      // Enviamos la ronda actual
        maxStages: session.maxStages,
        solution: session.status !== 'playing' ? session.targetWord : null 
    });

});

app.post('/api/wordle/guess', (req: Request, res: Response): any => {
    const { sessionId, guess } = req.body;
    
    if (!sessions.has(sessionId)) return res.status(404).json({ error: 'Session not found' });
    const session = sessions.get(sessionId)!;

    if (session.status !== 'playing') return res.status(400).json({ error: 'Game ended' });
    
    const normalizedGuess = normalizeWord(guess);
    const target = session.targetWord;

    // Validaciones
    if (normalizedGuess.length !== target.length) return res.json({ success: false, message: 'Longitud incorrecta' });
    if (!ALL_WORDS.includes(normalizedGuess)) return res.json({ success: false, message: 'Palabra no válida' });

    // Evaluar
    const evaluation = normalizedGuess.split('').map((letter, index) => {
        if (target[index] === letter) return 'correct';
        if (target.includes(letter)) {
             const letterCount = target.split('').filter(l => l === letter).length;
             const correctCount = target.split('').filter((l, i) => l === letter && normalizedGuess[i] === letter).length;
             const presentCount = normalizedGuess.split('').filter((l, i) => l === letter && target[i] !== letter && i < index).length;
             if (presentCount < letterCount - correctCount) return 'present';
        }
        return 'absent';
    });

    const newGuessObj = { word: normalizedGuess, evaluation };
    session.guesses.push(newGuessObj);
    session.lastActivity = Date.now();

    // --- LÓGICA DE VICTORIA / DERROTA / SIGUIENTE NIVEL ---
    
    if (normalizedGuess === target) {
        // ¡ACERTÓ LA PALABRA!
        if (session.stage < session.maxStages) {
            // Aún quedan rondas: preparamos la siguiente
            session.stage++;
            session.targetWord = getRandomWord();
            session.guesses = []; // Limpiamos tablero
            console.log(`🆙 Session ${sessionId}: Level Up to Stage ${session.stage}`);
        } else {
            // Era la última ronda: ¡VICTORIA TOTAL!
            session.status = 'won';
            console.log(`🏆 Session ${sessionId}: WON GAME`);
        }
    } else if (session.guesses.length >= MAX_ATTEMPTS) {
        // Se acabaron los intentos: PERDIÓ TODO
        session.status = 'lost';
        console.log(`💀 Session ${sessionId}: LOST at Stage ${session.stage}`);
    }

    res.json({ 
        success: true, 
        guesses: session.guesses, 
        status: session.status,
        stage: session.stage,
        solution: session.status !== 'playing' ? session.targetWord : null
    });
});

app.listen(port, () => {
  console.log(`🎮 Wordle Server (3 Stages) running on ${port}`);
});