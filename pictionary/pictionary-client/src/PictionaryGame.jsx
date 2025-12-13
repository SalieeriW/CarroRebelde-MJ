import React, { useState, useEffect, useRef } from 'react';
import './styles/pictionary.css'; 

const SERVER_URL = 'http://localhost:2234';

// Colores disponibles
const PALETTE_COLORS = ['#ffffff', '#f9d71c', '#e94560', '#00ffcc', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];

function PictionaryGame() {
  // --- ESTADOS ---
  const searchParams = new URLSearchParams(window.location.search);
  const urlSessionId = searchParams.get('sessionId');
  const urlRole = searchParams.get('role');
  const returnUrl = searchParams.get('returnUrl');

  const [sessionId] = useState(urlSessionId || Math.random().toString(36).substring(7));
  const [role, setRole] = useState(null);
  const [word, setWord] = useState('');
  const [wordLength, setWordLength] = useState(0); // Longitud de la palabra
  
  const [guess, setGuess] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isWon, setIsWon] = useState(false);
  const [currentColor, setCurrentColor] = useState(PALETTE_COLORS[0]);
  const [showHelp, setShowHelp] = useState(false);

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const inputRef = useRef(null);

  // --- EFECTOS ---

  // Tecla F10
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault(); 
        setShowHelp(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inicializar rol
  useEffect(() => {
    if (urlRole === 'drawer') initDrawer();
    else if (urlRole === 'guesser') initGuesser();
  }, []);

  // Fondo del canvas
  useEffect(() => {
    if (role && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#16213e'; 
        ctx.fillRect(0, 0, 800, 600);
    }
  }, [role]);

  // --- LOGICA DEL JUEGO ---

  const initDrawer = async () => {
    setRole('drawer');
    try {
      const res = await fetch(`${SERVER_URL}/api/pictionary/word?sessionId=${sessionId}`);
      const data = await res.json();
      setWord(data.word);
    } catch (e) { console.error(e); }
  };

  const initGuesser = () => {
    setRole('guesser');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/pictionary/canvas/${sessionId}`);
        const data = await res.json();
        
        // Capturar longitud para limitar el input
        if (data.wordLength && wordLength === 0) {
            setWordLength(data.wordLength);
        }

        if (data.solved) {
            handleWin();
            clearInterval(interval);
            return;
        }
        if (data.canvasData) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
            }
          };
          img.src = data.canvasData;
        }
      } catch (e) { console.error("Polling error", e); }
    }, 1000); 
    return () => clearInterval(interval);
  };

  const handleWin = () => {
      setIsWon(true);
      setStatusMsg("*** MISION COMPLETADA ***");
      if (returnUrl) setTimeout(() => { window.location.href = returnUrl; }, 3000);
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentColor; 
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const stopDrawing = async () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL(); 
    await fetch(`${SERVER_URL}/api/pictionary/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, canvasData: dataUrl })
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16213e'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stopDrawing(); 
  };

  const submitGuess = async () => {
    if (!guess) return;
    const res = await fetch(`${SERVER_URL}/api/pictionary/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, guess })
    });
    const data = await res.json();
    
    if (data.correct) {
      handleWin();
      setStatusMsg(`[ CORRECTO: ${data.word.toUpperCase()} ]`);
    } else {
      setStatusMsg("[ ERROR: INTENTALO DE NUEVO ]");
      setGuess('');
      setTimeout(() => setStatusMsg(""), 2000);
    }
  };

  // --- AQUI ESTA EL CAMBIO PRINCIPAL ---
  const handleInputChange = (e) => {
      const val = e.target.value.toUpperCase();
      // Si sabemos el largo, impedimos escribir mas caracteres
      if (wordLength > 0 && val.length > wordLength) {
          return;
      }
      setGuess(val);
  };

  const focusInput = () => {
      if (inputRef.current && !isWon) inputRef.current.focus();
  };

  // --- MODAL DE AYUDA ---
  const HelpModal = () => (
    <div className="retro-modal-overlay" onClick={() => setShowHelp(false)}>
      <div className="retro-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">== AYUDA DEL SISTEMA ==</div>
        <div className="modal-content">
          <p>TECLA [F10] : MENU</p>
          <br/>
          <p className="highlight">ROL: DIBUJANTE</p>
          <ul className="retro-list">
            <li>Dibuja la palabra objetivo.</li>
            <li>No escribas letras.</li>
          </ul>
          <br/>
          <p className="highlight">ROL: ADIVINADOR</p>
          <ul className="retro-list">
            <li>Mira la pantalla.</li>
            <li>Escribe la palabra y pulsa ENTER.</li>
          </ul>
        </div>
        <button className="retro-btn secondary full-width" onClick={() => setShowHelp(false)}>
          [ CERRAR ]
        </button>
      </div>
    </div>
  );

  // --- RENDERIZADO ---

  if (!role) {
    return (
      <div className="retro-game">
        {showHelp && <HelpModal />}
        <div className="retro-header">
            <h1 className="retro-title">PICTIONARY.EXE</h1>
        </div>
        <div className="retro-card">
            <p className="label">ID DE SESION:</p>
            <div className="retro-id-box">{sessionId}</div>
            <code className="retro-code">
                {window.location.origin}?sessionId={sessionId}
            </code>
        </div>
        <div className="retro-controls">
            <button className="retro-btn" onClick={initDrawer}>[ INICIAR DIBUJO ]</button>
            <button className="retro-btn secondary" onClick={initGuesser}>[ INICIAR ADIVINANZA ]</button>
        </div>
        <div className="footer-hint">PRESIONA [F10] PARA AYUDA</div>
      </div>
    );
  }

  return (
    <div className="retro-game">
      {showHelp && <HelpModal />}
      
      <div className="retro-header">
        <h2 className="retro-title">
            {role === 'drawer' ? 'MODO: DIBUJANTE' : 'MODO: ADIVINADOR'}
        </h2>
        
        {role === 'drawer' && (
            <div className="retro-word-box">
                OBJETIVO: <span className="highlight">{word.toUpperCase()}</span>
            </div>
        )}
        
        {isWon && <div className="retro-win-msg">{statusMsg}</div>}
        {!isWon && statusMsg && <div className="retro-status">{statusMsg}</div>}
      </div>

      {role === 'drawer' && !isWon && (
        <div className="retro-palette-container">
            {PALETTE_COLORS.map(color => (
                <button
                    key={color}
                    className={`palette-swatch ${currentColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                />
            ))}
        </div>
      )}

      <div className="retro-canvas-container">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={role === 'drawer' ? startDrawing : undefined}
            onMouseMove={role === 'drawer' ? draw : undefined}
            onMouseUp={role === 'drawer' ? stopDrawing : undefined}
            onMouseLeave={role === 'drawer' ? stopDrawing : undefined}
          />
      </div>

      <div className="retro-controls">
        {role === 'drawer' && (
           <button className="retro-btn danger" onClick={clearCanvas}>[ BORRAR PANTALLA ]</button>
        )}

        {role === 'guesser' && !isWon && (
          <div className="guesser-container">
            {/* Visualización de huecos tipo Ahorcado */}
            <div className="word-slots" onClick={focusInput}>
                {Array.from({ length: wordLength || Math.max(guess.length + 1, 6) }).map((_, i) => (
                    <div key={i} className={`slot ${guess[i] ? 'filled' : ''}`}>
                        {guess[i] || '_'}
                    </div>
                ))}
            </div>
            
            {/* Input Invisible */}
            <input 
              ref={inputRef}
              className="ghost-input"
              type="text" 
              value={guess}
              autoFocus 
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
              autoComplete="off"
              maxLength={wordLength} 
            />
            
            <button className="retro-btn" onClick={submitGuess}>[ ENTER ]</button>
          </div>
        )}
      </div>
      <div className="footer-hint">PRESIONA [F10] PARA AYUDA</div>
    </div>
  );
}

export default PictionaryGame;