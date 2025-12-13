import React, { useState, useEffect, useRef } from 'react';
import './styles/pictionary.css';

const SERVER_URL = 'http://localhost:2234';

function PictionaryGame() {
  // 1. Gestionar SessionID desde URL
  const [sessionId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('sessionId') || Math.random().toString(36).substring(7);
  });

  const [role, setRole] = useState(null); // 'drawer' | 'guesser'
  const [word, setWord] = useState('');
  const [guess, setGuess] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isWon, setIsWon] = useState(false);

  // Referencias Canvas
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // --- LÓGICA DEL DRAWER ---
  
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

  const startDrawing = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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
    
    // Enviar al servidor
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL(); // Convertir a Base64
    
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
    stopDrawing(); // Enviar borrado al servidor
  };

  // --- LÓGICA DEL GUESSER ---

  const initGuesser = () => {
    setRole('guesser');
    // Iniciar Polling
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/pictionary/canvas/${sessionId}`);
        const data = await res.json();
        
        if (data.solved) {
            setIsWon(true);
            setStatusMsg("¡ALGUIEN ACERTÓ!");
            clearInterval(interval);
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
    }, 1000); // Actualiza cada 1 segundo

    return () => clearInterval(interval);
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
      setIsWon(true);
      setStatusMsg(`¡CORRECTO! La palabra era ${data.word.toUpperCase()}`);
    } else {
      setStatusMsg("Incorrecto, sigue intentando...");
      setTimeout(() => setStatusMsg(""), 2000);
    }
    setGuess('');
  };

  // Inicializar Canvas (fondo)
  useEffect(() => {
    if (role && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, 800, 600);
    }
  }, [role]);

  // --- RENDER ---

  if (!role) {
    return (
      <div className="container">
        <h1>🎨 PICTIONARY</h1>
        <p>ID de Sesión: <strong>{sessionId}</strong></p>
        <div className="controls">
          <button onClick={initDrawer}>🖌️ DIBUJAR</button>
          <button onClick={initGuesser}>🤔 ADIVINAR</button>
        </div>
        <p>Comparte esta URL con tu compañero:</p>
        <code style={{background: '#333', padding: '5px'}}>
          {window.location.href.split('?')[0]}?sessionId={sessionId}
        </code>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h2>Role: {role === 'drawer' ? '🖌️ DIBUJANTE' : '🤔 ADIVINADOR'}</h2>
        {role === 'drawer' && <div className="word-display">DIBUJA: {word.toUpperCase()}</div>}
        {isWon && <div style={{color: '#2ecc71', fontSize: '24px'}}>🎉 {statusMsg} 🎉</div>}
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={role === 'drawer' ? startDrawing : undefined}
        onMouseMove={role === 'drawer' ? draw : undefined}
        onMouseUp={role === 'drawer' ? stopDrawing : undefined}
        onMouseLeave={role === 'drawer' ? stopDrawing : undefined}
      />

      <div className="controls">
        {role === 'drawer' && (
           <button onClick={clearCanvas}>BORRAR TODO</button>
        )}

        {role === 'guesser' && !isWon && (
          <>
            <input 
              type="text" 
              value={guess} 
              onChange={(e) => setGuess(e.target.value)}
              placeholder="¿Qué es esto?"
              onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            />
            <button onClick={submitGuess}>ADIVINAR</button>
          </>
        )}
      </div>
      <div className="status">{statusMsg}</div>
    </div>
  );
}

export default PictionaryGame;