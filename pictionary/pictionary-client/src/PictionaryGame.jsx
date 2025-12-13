import React, { useState, useEffect, useRef } from 'react';
import './styles/pictionary.css'; 

const SERVER_URL = 'http://localhost:2234';

function PictionaryGame() {
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

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (urlRole === 'drawer') initDrawer();
    else if (urlRole === 'guesser') initGuesser();
  }, []);

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
      setStatusMsg("¡VICTORIA! 🎉");
      if (returnUrl) {
          setTimeout(() => { window.location.href = returnUrl; }, 3000);
      }
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
    ctx.strokeStyle = 'white';
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
      setStatusMsg(`¡CORRECTO! ERA ${data.word.toUpperCase()}`);
    } else {
      setStatusMsg("INCORRECTO, SIGUE INTENTANDO...");
      setTimeout(() => setStatusMsg(""), 2000);
    }
    setGuess('');
  };

  useEffect(() => {
    if (role && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, 800, 600);
    }
  }, [role]);

  // --- RENDERIZADO: MENÚ INICIAL ---
  if (!role) {
    return (
      <div className="retro-game">
        <div className="retro-header">
            <h1 className="retro-title">🎨 PICTIONARY DEV</h1>
        </div>
        
        {/* Tarjeta de información */}
        <div className="retro-card">
            <p style={{marginBottom:'10px'}}>SALA ID:</p>
            <div className="retro-id-box">{sessionId}</div>
            
            <p style={{marginTop:'20px', fontSize:'10px', color:'#aaa'}}>COMPARTE ESTA URL:</p>
            <code className="retro-code">
                {window.location.origin}?sessionId={sessionId}
            </code>
        </div>

        <div className="retro-controls">
            <button className="retro-btn" onClick={initDrawer}>🖌️ DIBUJAR</button>
            <button className="retro-btn secondary" onClick={initGuesser}>🤔 ADIVINAR</button>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: JUEGO ACTIVO ---
  return (
    <div className="retro-game">
      <div className="retro-header">
        <h2 className="retro-title">{role === 'drawer' ? '🖌️ DIBUJANTE' : '🤔 ADIVINADOR'}</h2>
        
        {role === 'drawer' && (
            <div className="retro-word-box">
                OBJETIVO: <span style={{color: '#f9d71c'}}>{word.toUpperCase()}</span>
            </div>
        )}
        
        {isWon && <div className="retro-win-msg">🎉 {statusMsg} 🎉</div>}
        {!isWon && statusMsg && <div className="retro-status">{statusMsg}</div>}
      </div>

      {/* Contenedor para el borde blanco del canvas */}
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
           <button className="retro-btn secondary" onClick={clearCanvas}>🗑️ BORRAR TODO</button>
        )}

        {role === 'guesser' && !isWon && (
          <>
            <input 
              className="retro-input"
              type="text" 
              value={guess} 
              onChange={(e) => setGuess(e.target.value)}
              placeholder="¿QUÉ ES?"
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            />
            <button className="retro-btn" onClick={submitGuess}>ENVIAR</button>
          </>
        )}
      </div>
    </div>
  );
}

export default PictionaryGame;