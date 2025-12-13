import React, { useState, useEffect, useRef } from 'react';
import './styles/pictionary.css'; // Asegúrate de la ruta

const SERVER_URL = 'http://localhost:2234';

// Colores disponibles para la paleta
const PALETTE_COLORS = [
    '#ffffff', // Blanco
    '#f9d71c', // Amarillo Retro
    '#e94560', // Rojo Retro
    '#00ffcc', // Cian Neon
    '#3498db', // Azul
    '#2ecc71', // Verde
    '#9b59b6', // Púrpura
    '#e67e22'  // Naranja
];

function PictionaryGame() {
  // --- ESTADOS ---
  const searchParams = new URLSearchParams(window.location.search);
  const urlSessionId = searchParams.get('sessionId');
  const urlRole = searchParams.get('role');
  const returnUrl = searchParams.get('returnUrl');

  const [sessionId] = useState(urlSessionId || Math.random().toString(36).substring(7));
  const [role, setRole] = useState(null);
  const [word, setWord] = useState('');
  const [guess, setGuess] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isWon, setIsWon] = useState(false);

  // NUEVOS ESTADOS
  const [currentColor, setCurrentColor] = useState(PALETTE_COLORS[0]); // Color actual
  const [showHelp, setShowHelp] = useState(false); // Mostrar modal ayuda

  // Refs
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- EFECTOS (Listeners y Sockets) ---

  // 1. Escuchar Tecla F10
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault(); // Evitar menú del navegador
        setShowHelp(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Inicializar rol por URL
  useEffect(() => {
    if (urlRole === 'drawer') initDrawer();
    else if (urlRole === 'guesser') initGuesser();
  }, []);

  // 3. Inicializar fondo de canvas al cargar el rol
  useEffect(() => {
    if (role && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        // Coincide con el fondo del CSS retro
        ctx.fillStyle = '#16213e'; 
        ctx.fillRect(0, 0, 800, 600);
    }
  }, [role]);


  // --- FUNCIONES DEL JUEGO ---

  const initDrawer = async () => {
    setRole('drawer');
    try {
      const res = await fetch(`${SERVER_URL}/api/pictionary/word?sessionId=${sessionId}`);
      const data = await res.json();
      setWord(data.word);
    } catch (e) {
      console.error("Error fetching word", e);
    }
  };

  const initGuesser = () => {
    setRole('guesser');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/pictionary/canvas/${sessionId}`);
        const data = await res.json();
        
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
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000); 
    return () => clearInterval(interval);
  };

  const handleWin = () => {
      setIsWon(true);
      // Texto sin emoji
      setStatusMsg(">> MISIÓN COMPLETADA <<");
      if (returnUrl) {
          setTimeout(() => { window.location.href = returnUrl; }, 3000);
      }
  };

  // --- LÓGICA DE DIBUJO (Canvas) ---

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
    // USAR EL COLOR SELECCIONADO
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
    ctx.fillStyle = '#16213e'; // Mismo fondo oscuro
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
      setStatusMsg(`>> CORRECTO: ${data.word.toUpperCase()} <<`);
    } else {
      setStatusMsg("[ ERROR: INTÉNTALO DE NUEVO ]");
      setTimeout(() => setStatusMsg(""), 2000);
    }
    setGuess('');
  };

  // --- COMPONENTE MODAL DE AYUDA ---
  const HelpModal = () => (
    <div className="retro-modal-overlay" onClick={() => setShowHelp(false)}>
      <div className="retro-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"> PRESIONA [F10] PARA AYUDA </div>
        <div className="modal-content">
          <p className="highlight">ROL: DIBUJANTE</p>
          <ul className="retro-list">
            <li>Dibuja la palabra objetivo.</li>
            <li>Usa la paleta de colores superior.</li>
            <li>PROHIBIDO escribir letras o números.</li>
          </ul>
          <br/>
          <p className="highlight">ROL: ADIVINADOR</p>
          <ul className="retro-list">
            <li>Observa la pantalla.</li>
            <li>Escribe qué crees que es y pulsa [ENTER].</li>
          </ul>
        </div>
        <button className="retro-btn secondary full-width" onClick={() => setShowHelp(false)}>
          [ CERRAR ]
        </button>
      </div>
    </div>
  );

  // --- RENDERIZADO MENÚ INICIAL ---
  if (!role) {
    return (
      <div className="retro-game">
        {showHelp && <HelpModal />}
        <div className="retro-header">
            <h1 className="retro-title">PICTIONARY.EXE</h1>
        </div>
        
        <div className="retro-card">
            <p className="label">ID DE SESIÓN:</p>
            <div className="retro-id-box">{sessionId}</div>
            <p className="label tiny">ENLACE PARA COMPARTIR:</p>
            <code className="retro-code">
                {window.location.origin}?sessionId={sessionId}
            </code>
        </div>

        <div className="retro-controls">
            <button className="retro-btn" onClick={initDrawer}>[ INICIAR DIBUJO ]</button>
            <button className="retro-btn secondary" onClick={initGuesser}>[ INICIAR ADIVINANZA ]</button>
        </div>
        
        <div className="footer-hint">PRESS [F10] FOR HELP SYSTEM</div>
      </div>
    );
  }

  // --- RENDERIZADO JUEGO ACTIVO ---
  return (
    <div className="retro-game">
      {showHelp && <HelpModal />}
      
      <div className="retro-header">
        {/* Títulos sin emojis */}
        <h2 className="retro-title">
            {role === 'drawer' ? 'MODE: DIBUJANTE' : 'MODE: ADIVINADOR'}
        </h2>
        
        {role === 'drawer' && (
            <div className="retro-word-box">
                OBJETIVO: <span className="highlight">{word.toUpperCase()}</span>
            </div>
        )}
        
        {isWon && <div className="retro-win-msg">{statusMsg}</div>}
        {!isWon && statusMsg && <div className="retro-status">{statusMsg}</div>}
      </div>

      {/* PALETA DE COLORES (Solo Dibujante) */}
      {role === 'drawer' && !isWon && (
        <div className="retro-palette-container">
            {PALETTE_COLORS.map(color => (
                <button
                    key={color}
                    className={`palette-swatch ${currentColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                    title={color} // Tooltip simple
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
            // Botón rojo sin emoji
           <button className="retro-btn danger" onClick={clearCanvas}>[ BORRAR PANTALLA ]</button>
        )}

        {role === 'guesser' && !isWon && (
          <>
            <input 
              className="retro-input"
              type="text" 
              value={guess} 
              onChange={(e) => setGuess(e.target.value)}
              placeholder="INSERTAR DATOS..."
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            />
            <button className="retro-btn" onClick={submitGuess}>[ ENVIAR ]</button>
          </>
        )}
      </div>
      <div className="footer-hint">PRESS [F10] FOR HELP SYSTEM</div>
    </div>
  );
}

export default PictionaryGame;