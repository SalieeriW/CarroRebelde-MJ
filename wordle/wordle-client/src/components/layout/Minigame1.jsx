import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../styles/wordle.css';

// URL del backend del minijuego (sincronización visual)
const MINIGAME_SERVER_URL = 'http://localhost:1234';
// URL por defecto (fallback) si no se provee returnUrl
const MAIN_GAME_SERVER_URL_DEFAULT = 'http://localhost:2567/minigame/result';

const Minigame1 = () => {
  // Parámetros de URL
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('sessionId') || 'test-session';
  const roomCode = searchParams.get('room'); 
  // 1. CAPTURAMOS EL RETURN URL
  const returnUrl = searchParams.get('returnUrl'); 
  
  // Estado del juego
  const [wordLength, setWordLength] = useState(5);
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [stage, setStage] = useState(1);
  const [maxStages, setMaxStages] = useState(3);

  const [solution, setSolution] = useState(null);
  // -----------------------------------------------
  
  const [currentGuess, setCurrentGuess] = useState('');
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  
  // Evitar enviar el resultado varias veces
  const resultSent = useRef(false);

  // --- 1. SINCRONIZACIÓN CON SERVIDOR MINIJUEGO (Polling) ---
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const res = await fetch(`${MINIGAME_SERVER_URL}/api/wordle/state/${sessionId}`);
        const data = await res.json();
        
        if (data) {
          console.log("%c 🕵️ SOLUCIÓN: " + data.solution);
            // Si cambia la stage, limpiamos el input local
            if (data.stage !== stage) {
                setCurrentGuess('');
            }
            
            setWordLength(data.wordLength);
            setGuesses(data.guesses);
            setGameStatus(data.status);
            setStage(data.stage);
            setMaxStages(data.maxStages);

            // Guardar la solución si el servidor la envía
            if (data.solution) {
              setSolution(data.solution);
            }
        }
      } catch (e) { console.error("Sync error", e); }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 1000); 
    return () => clearInterval(interval);
  }, [sessionId, stage]);

  // --- 2. ENVIAR RESULTADO AL ENDPOINT ESPECIFICADO ---
  useEffect(() => {
    const sendResultToMainGame = async () => {
        // Validación básica: necesitamos roomCode o un returnUrl explícito
        if (!roomCode && !returnUrl) {
            setMessage("ERROR: FALTA CONFIGURACIÓN DE RETORNO");
            return;
        }

        if (resultSent.current) return;
        resultSent.current = true; // Bloquear envíos múltiples

        const won = gameStatus === 'won'; // Esto asegura que won sea booleano
        
        // 2. DETERMINAMOS EL ENDPOINT DE DESTINO
        // Si existe returnUrl, lo usamos. Si no, usamos el default.
        const targetUrl = returnUrl 
            ? decodeURIComponent(returnUrl) 
            : MAIN_GAME_SERVER_URL_DEFAULT;

        console.log(`📤 Enviando resultado a: ${targetUrl}`);
        console.log(`📊 Estado: ${won ? 'VICTORIA' : 'DERROTA'}`);

        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // roomCode: roomCode || 'unknown', // Lo quito, un poco inutil.
                    won: won 
                })
            });
            
            const data = await response.json();
            // Aceptamos success: true o cualquier respuesta 200 OK válida según tu API
            if (response.ok) {
                console.log('✅ Resultado procesado correctamente');
                setMessage("RESULTADO ENVIADO. CERRANDO...");
                // Opcional: Cerrar ventana tras unos segundos
                setTimeout(() => window.close(), 4000);
            } else {
                console.error('❌ Error enviando resultado:', data);
                setMessage(`ERROR REMOTO: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            setMessage("ERROR DE CONEXIÓN AL ENVIAR RESULTADOS");
        }
    };

    if (gameStatus === 'won' || gameStatus === 'lost') {
        sendResultToMainGame();
    }
  }, [gameStatus, roomCode, returnUrl]);


  // --- MANEJO DE INPUT (Sin cambios) ---
  const handleKeyPress = useCallback((letter) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < wordLength) {
      setCurrentGuess(prev => prev + letter);
    }
  }, [gameStatus, currentGuess.length, wordLength]);

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const handleSubmit = useCallback(async () => {
    if (currentGuess.length !== wordLength || gameStatus !== 'playing') {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      const res = await fetch(`${MINIGAME_SERVER_URL}/api/wordle/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, guess: currentGuess })
      });
      
      const data = await res.json();

      if (data.success) {
          setCurrentGuess('');
          // Actualización optimista
          if (data.guesses) setGuesses(data.guesses);
          if (data.status) setGameStatus(data.status);
          if (data.stage) setStage(data.stage);
          // Actualizar solución inmediatamente si perdemos/ganamos
          if (data.solution) setSolution(data.solution); 
      } else {
          setMessage(data.message || 'Error');
          setShake(true);
          setTimeout(() => { setShake(false); setMessage(''); }, 2000);
      }
    } catch (error) {
      console.error('Network Error:', error);
    }
  }, [currentGuess, wordLength, gameStatus, sessionId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;
      if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Backspace') handleBackspace();
      else if (/^[a-zA-ZñÑ]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleSubmit, handleBackspace, handleKeyPress]);

  // --- RENDER (Sin cambios visuales) ---
  const renderGrid = () => {
    const grid = [];
    const maxAttempts = 6;
    
    for (let i = 0; i < maxAttempts; i++) {
      const guess = guesses[i]; 
      const isCurrentRow = i === guesses.length; 
      
      grid.push(
        <div key={i} className={`wordle-row ${shake && isCurrentRow ? 'shake' : ''}`}>
          {Array.from({ length: wordLength }).map((_, j) => {
            let letter = '';
            let state = '';
            if (guess) {
              letter = guess.word[j] || '';
              state = guess.evaluation[j] || '';
            } else if (isCurrentRow && currentGuess[j]) {
              letter = currentGuess[j];
              state = 'filled'; 
            }
            return (
              <div key={j} className={`wordle-cell ${state}`}>
                <span className="letter">{letter}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="wordle-game">
      <div className="wordle-header">
        <h1 className="wordle-title">DESENCRIPTADO</h1>
        {/* INDICADOR DE NIVEL */}
        <div className="wordle-stage-indicator">
            RONDA <span className="highlight">{stage}</span> DE {maxStages}
        </div>
      </div>

      <div className="wordle-board">
        {renderGrid()}
      </div>

      <div className="wordle-footer">
        <p className="wordle-instruction">
           COOPERATIVO: Ambos veis lo mismo. <br/>
           ¡No falléis o se reiniciará el sistema!
        </p>
      </div>

      {message && <div className="wordle-toast">{message}</div>}

      {/* OVERLAY DE RESULTADO */}
      {gameStatus !== 'playing' && (
        <div className="wordle-overlay">
          <div className="wordle-result">
            <h2>{gameStatus === 'won' ? 'FELICIDADES GANASTE!' : 'FALLÁSTEIS :('}</h2>
            
            {/* MOSTRAR SOLUCIÓN SI PIERDEN */}
            {gameStatus === 'lost' && solution && (
                <div className="solution-box">
                    <p>LA PALABRA ERA:</p>
                    <h3 className="highlight-danger">{solution}</h3>
                </div>
            )}
            
            <p className="status-text">
              Volviendo...
            </p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Minigame1;