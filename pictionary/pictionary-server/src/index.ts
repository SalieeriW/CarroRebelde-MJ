import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const app = express();
const PORT = process.env.PORT || 2234;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' })); 

// ============================================
// 1. LÓGICA DE PALABRAS
// ============================================

let ALL_WORDS: string[] = [];  
let GAME_WORDS: string[] = []; 

const normalizeWord = (word: string): string => {
    return word
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
};

// Cargar archivos de forma segura
try {
    const txtPath = join(process.cwd(), 'resources', 'spanish.txt');
    const txtData = readFileSync(txtPath, 'utf-8');
    ALL_WORDS = txtData.split('\n').map(w => normalizeWord(w)).filter(w => w.length > 0);
} catch (error) {
    console.error('⚠️ Warning: spanish.txt not found. Validation disabled.');
}

try {
    const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const words = JSON.parse(jsonData);
    GAME_WORDS = words.map((w: string) => normalizeWord(w)).filter((w: string) => w.length > 0);
    console.log(`✅ Loaded ${GAME_WORDS.length} game words.`);
} catch (error) {
    console.error('⚠️ Warning: spanish.json not found. Using default words.');
    GAME_WORDS = ['GATO', 'PERRO', 'CASA', 'SOL'];
}

const getRandomWord = () => {
    if (GAME_WORDS.length === 0) return 'ERROR';
    const randomIndex = randomInt(0, GAME_WORDS.length);
    return GAME_WORDS[randomIndex];
};

// ============================================
// 2. ESTADO DEL JUEGO
// ============================================

interface GameSession {
    round: number;          
    totalRounds: number;    
    score: number;
    word: string;       
    canvasData: string; 
    guesses: string[];
    solved: boolean;
    lastActivity: number;
}

const sessions = new Map<string, GameSession>();

// Limpieza de sesiones viejas
setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, id) => {
        if (now - session.lastActivity > 3600000) sessions.delete(id);
    });
}, 600000); 

// ============================================
// 3. ENDPOINTS API
// ============================================

// --- INICIAR / RECUPERAR SESIÓN ---
app.get('/api/pictionary/word', (req: Request, res: Response): any => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    // === FIX PARA DOCKER/REFRESH ===
    // Si la sesión existe pero ya terminó, la borramos para empezar de 0
    if (sessions.has(sessionId)) {
        const existing = sessions.get(sessionId)!;
        if (existing.round > existing.totalRounds) {
            console.log(`♻️ Resetting finished session: ${sessionId}`);
            sessions.delete(sessionId);
        }
    }

    if (!sessions.has(sessionId)) {
        const initialWord = getRandomWord();
        sessions.set(sessionId, {
            round: 1,
            totalRounds: 3,
            score: 0,
            word: initialWord,
            canvasData: '',
            guesses: [],
            solved: false,
            lastActivity: Date.now()
        });
        console.log(`🆕 New Session: ${sessionId} | Word: ${initialWord}`);
    }

    const session = sessions.get(sessionId)!;
    
    res.json({ 
        word: session.word, 
        sessionId,
        round: session.round,
        totalRounds: session.totalRounds
    });
});

// --- DIBUJAR ---
app.post('/api/pictionary/draw', (req: Request, res: Response): any => {
    const { sessionId, canvasData } = req.body;
    if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.canvasData = canvasData;
        session.lastActivity = Date.now();
    }
    res.json({ success: true });
});

// --- POLLING (ESTADO) ---
app.get('/api/pictionary/canvas/:sessionId', (req: Request, res: Response): any => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.json({ 
            canvasData: '', solved: false, wordLength: 0,
            round: 1, totalRounds: 3, gameOver: false 
        }); 
    }

    res.json({ 
        canvasData: session.canvasData,
        solved: session.solved,
        wordLength: session.word.length,
        round: session.round,
        totalRounds: session.totalRounds,
        gameOver: session.round > session.totalRounds
    });
});

app.post('/api/pictionary/guess', (req: Request, res: Response): any => {
    const { sessionId, guess } = req.body;
    const session = sessions.get(sessionId);
    
    console.log(`🔍 Guess received: "${guess}" for session ${sessionId}`);
    console.log(`📊 Current state:`, {
        word: session?.word,
        round: session?.round,
        solved: session?.solved
    });
    
    if (!session) return res.status(404).json({ error: 'No session' });
    if (session.round > session.totalRounds) return res.json({ correct: false });

    const normalizedGuess = normalizeWord(guess || '');
    const isCorrect = normalizedGuess === session.word;
    
    console.log(`✓ Comparison: "${normalizedGuess}" === "${session.word}" ? ${isCorrect}`);
    
    if (isCorrect) {
        session.solved = true;
        console.log(`🎉 Round ${session.round} WON!`);
        
        setTimeout(() => {
            if (session.solved) {
                const oldRound = session.round;
                session.round++;
                
                if (session.round <= session.totalRounds) {
                    session.word = getRandomWord();
                    session.canvasData = '';
                    session.solved = false;
                    session.guesses = [];
                    console.log(`⏩ Advanced: Round ${oldRound} → ${session.round}, new word: ${session.word}`);
                } else {
                    console.log(`🏁 Game finished!`);
                }
            }
        }, 3000);
    }

    res.json({ correct: isCorrect, word: isCorrect ? session.word : null });
});
// --- SIGUIENTE RONDA (Ahora opcional, ya se hace automático) ---
app.post('/api/pictionary/next-round', (req: Request, res: Response): any => {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) return res.json({ success: false });

    // Si ya se procesó automáticamente, solo confirmar
    if (session.round > 1 && !session.solved) {
        return res.json({ success: true, round: session.round });
    }

    // Forzar avance manual (por si acaso)
    if (session.solved || session.round === 1) {
        session.round++;
        if (session.round <= session.totalRounds) {
            session.word = getRandomWord();
            session.canvasData = '';
            session.solved = false;
            session.guesses = [];
            console.log(`⏩ Manual Next Round (${session.round}): ${session.word}`);
        }
        res.json({ success: true, round: session.round });
    } else {
        res.json({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`\n🎨 Server running inside Docker on port ${PORT}`);
});