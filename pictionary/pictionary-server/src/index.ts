import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomInt } from 'crypto';

const app = express();
const PORT = process.env.PORT || 2234;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' })); // Límite alto para recibir imágenes Base64

// ============================================
// 1. LÓGICA DE PALABRAS (Igual que Wordle)
// ============================================

let ALL_WORDS: string[] = [];  // Todas las palabras válidas (diccionario)
let GAME_WORDS: string[] = []; // Palabras para dibujar

// Función vital para comparar "Árbol" con "arbol"
const normalizeWord = (word: string): string => {
    return word
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
};

// Cargar spanish.txt (Validación general)
try {
    const txtPath = join(process.cwd(), 'resources', 'spanish.txt');
    const txtData = readFileSync(txtPath, 'utf-8');
    ALL_WORDS = txtData.split('\n').map(w => normalizeWord(w)).filter(w => w.length > 0);
} catch (error) {
    console.error('❌ Error loading spanish.txt', error);
    ALL_WORDS = [];
}

// Cargar spanish.json (Palabras del juego)
try {
    const jsonPath = join(process.cwd(), 'resources', 'spanish.json');
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const words = JSON.parse(jsonData);
    GAME_WORDS = words.map((w: string) => normalizeWord(w)).filter((w: string) => w.length > 0);
    console.log(`✅ Loaded ${GAME_WORDS.length} game words from spanish.json`);
} catch (error) {
    console.error('❌ Error loading spanish.json', error);
    GAME_WORDS = ['GATO', 'PERRO', 'CASA', 'SOL']; // Fallback
}

// ============================================
// 2. ESTADO DEL JUEGO (Sessiones)
// ============================================

interface GameSession {
    word: string;       // Palabra normalizada (EJ: "CAMION")
    canvasData: string; // Base64
    guesses: string[];
    solved: boolean;
    lastActivity: number;
}

const sessions = new Map<string, GameSession>();

// Limpieza automática de sesiones viejas (opcional, para no llenar memoria)
setInterval(() => {
    const now = Date.now();
    sessions.forEach((session, id) => {
        if (now - session.lastActivity > 3600000) { // 1 hora inactivo
            sessions.delete(id);
        }
    });
}, 600000); 

// ============================================
// 3. ENDPOINTS API
// ============================================

// --- DRAWER: Obtener palabra e iniciar sesión ---
app.get('/api/pictionary/word', (req: Request, res: Response): any => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    // Si no existe la sesión, crearla con una palabra random de GAME_WORDS
    if (!sessions.has(sessionId)) {
        if (GAME_WORDS.length === 0) return res.status(500).json({ error: 'No words loaded' });
        
        const randomIndex = randomInt(0, GAME_WORDS.length);
        const selectedWord = GAME_WORDS[randomIndex];

        sessions.set(sessionId, {
            word: selectedWord,
            canvasData: '',
            guesses: [],
            solved: false,
            lastActivity: Date.now()
        });
        console.log(`🆕 Session ${sessionId}: Word is "${selectedWord}"`);
    }

    const session = sessions.get(sessionId)!;
    // IMPORTANTE: Devolvemos la palabra al Drawer
    res.json({ word: session.word, sessionId });
});

// --- DRAWER: Subir dibujo ---
app.post('/api/pictionary/draw', (req: Request, res: Response): any => {
    const { sessionId, canvasData } = req.body;
    
    if (!sessions.has(sessionId)) return res.status(404).json({ error: 'Session not found' });

    const session = sessions.get(sessionId)!;
    session.canvasData = canvasData;
    session.lastActivity = Date.now();
    
    res.json({ success: true });
});

// --- GUESSER: Ver dibujo ---
app.get('/api/pictionary/canvas/:sessionId', (req: Request, res: Response): any => {
    const { sessionId } = req.params;
    
    const session = sessions.get(sessionId);
    if (!session) return res.json({ canvasData: '', solved: false });

    res.json({ 
        canvasData: session.canvasData,
        solved: session.solved 
    });
});

// --- GUESSER: Adivinar ---
app.post('/api/pictionary/guess', (req: Request, res: Response): any => {
    const { sessionId, guess } = req.body;
    
    if (!sessions.has(sessionId)) return res.status(404).json({ error: 'Session not found' });
    if (!guess) return res.status(400).json({ error: 'Guess required' });

    const session = sessions.get(sessionId)!;
    const normalizedGuess = normalizeWord(guess);
    
    // Verificamos si es correcto
    const isCorrect = normalizedGuess === session.word;
    
    // (Opcional) Podríamos verificar si existe en ALL_WORDS para decir "Esa palabra no existe",
    // pero en Pictionary suele bastar con Correcto/Incorrecto.
    const isValidWord = ALL_WORDS.includes(normalizedGuess); 

    session.guesses.push(normalizedGuess);
    if (isCorrect) session.solved = true;
    session.lastActivity = Date.now();

    console.log(`🤔 Guess Session ${sessionId}: "${normalizedGuess}" vs "${session.word}" = ${isCorrect ? 'WIN' : 'NO'}`);

    res.json({ 
        correct: isCorrect, 
        word: isCorrect ? session.word : null, // Revelar solo si acierta
        isValidWord: isValidWord // Por si quieres mostrar "Esa palabra no existe" en el front
    });
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'pictionary-2-server',
        activeSessions: sessions.size,
        wordsLoaded: GAME_WORDS.length
    });
});

app.listen(PORT, () => {
    console.log(`\n🎨 Pictionary Server (Minigame 2)`);
    console.log(`📡 Running on: http://localhost:${PORT}`);
    console.log(`📚 Game Words loaded: ${GAME_WORDS.length}`);
    console.log(`📚 Dictionary Words loaded: ${ALL_WORDS.length}`);
});