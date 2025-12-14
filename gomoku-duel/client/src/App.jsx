import React, { useState, useEffect, useRef, useCallback } from 'react';
import useMultiplayerGame from './hooks/useMultiplayerGame';
import Lobby from './components/Lobby';
import Briefing from './components/Briefing';
import GomokuGame from './components/GomokuGame';
import PixelDialog from './components/PixelDialog';

function App() {
  const defaultRole = import.meta.env.VITE_DEFAULT_ROLE || null;
  const [preferredRole, setPreferredRole] = useState(defaultRole);
  const [showDialog, setShowDialog] = useState(null);
  const exitingRef = useRef(false);
  const {
    state,
    error,
    connected,
    myRole,
    sessionCode,
    claimRole,
    releaseRole,
    setReady,
    setPlayerColor,
    startCountdown,
    makeMove,
    resetGame,
    sendChat,
    requestExit,
    cancelExit,
    leaveRoom,
  } = useMultiplayerGame(preferredRole);

  const [currentView, setCurrentView] = useState('lobby');

  useEffect(() => {
    if (!state) return;
    setCurrentView(state.phase);
  }, [state?.phase]);

  const handleClaimRole = (role) => {
    claimRole(role);
    setPreferredRole(role);
  };

  const handleReleaseRole = (role) => {
    releaseRole(role);
    setPreferredRole(null);
  };

  const handleToggleReady = (ready) => {
    setReady(ready);
  };

  const handleStart = () => {
    startCountdown();
  };

  const handleMove = (x, y) => {
    makeMove(x, y);
  };

  const handleReset = () => {
    resetGame();
  };

  const handleSendChat = (text) => {
    sendChat(text);
  };

  const handleColorChange = (color) => {
    setPlayerColor(color);
  };

  const reportResult = async (won = false) => {
    const host = typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'localhost';
    const url = `http://${host}:2567/minigame/result`;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:73',message:'reportResult called',data:{won,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ won }),
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:82',message:'Minigame result response',data:{status:response.status,statusText:response.statusText,ok:response.ok,requestBody:{won}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      if (!response.ok) {
        console.warn('Failed to send minigame result:', response.status);
      }
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:90',message:'Minigame result error',data:{error:e.message,stack:e.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      console.warn('No se pudo enviar resultado del minijuego', e);
    }
  };

  const exitRequests = state?.exitRequests || { A: false, B: false };
  const myExitRequested = myRole === 'A' ? exitRequests.A : exitRequests.B;
  const otherExitRequested = myRole === 'A' ? exitRequests.B : exitRequests.A;
  const bothWantExit = Boolean(myExitRequested && otherExitRequested);

  const handleExitToMainboard = useCallback(async (won = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:110',message:'handleExitToMainboard called',data:{won,exitingRef:exitingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    if (exitingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:113',message:'Already exiting, returning early',data:{won,exitingRef:exitingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      return;
    }
    exitingRef.current = true;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:116',message:'Calling leaveRoom and reportResult',data:{won},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    leaveRoom();
    await reportResult(won);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:120',message:'Navigating to mainboard',data:{won},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    window.location.href = '/';
  }, [leaveRoom, reportResult]);

  useEffect(() => {
    if (bothWantExit) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:118',message:'bothWantExit detected',data:{bothWantExit,myExitRequested,otherExitRequested,exitingRef:exitingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      setShowDialog(null);
      handleExitToMainboard(false);
    }
  }, [bothWantExit, handleExitToMainboard]);

  useEffect(() => {
    if (otherExitRequested && !myExitRequested && !bothWantExit) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4742f3a-4307-4e14-a3d4-5fb2145a2fd7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/App.jsx:130',message:'Showing exit dialog',data:{otherExitRequested,myExitRequested,bothWantExit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      setShowDialog({
        type: 'confirm',
        title: 'Tu compañero quiere salir',
        message: '¿Abandonan la partida? Deben aceptar ambos.',
        confirmText: 'Aceptar',
        cancelText: 'Seguir jugando',
        onConfirm: () => {
          setShowDialog(null);
          requestExit();
        },
        onCancel: () => {
          setShowDialog(null);
          cancelExit();
        },
      });
    }
  }, [otherExitRequested, myExitRequested, bothWantExit, requestExit, cancelExit]);

  const handleExitConfirm = (won = false) => {
    if (won) {
      handleExitToMainboard(won);
      return;
    }
    setShowDialog({
      type: 'confirm',
      title: 'Salir del Juego',
      message: '¿Quieres salir del juego? Debes esperar la confirmación del otro jugador.',
      confirmText: 'Solicitar salir',
      cancelText: 'Quedarme',
      onConfirm: () => {
        setShowDialog(null);
        requestExit();
      },
      onCancel: () => {
        setShowDialog(null);
        exitingRef.current = false;
      },
    });
  };

  if (error) {
    return (
      <div className="error-container">
        <h1>Error de Conexión</h1>
        <p>{error.message}</p>
        <button className="pixel-button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!connected || !state) {
    return (
      <div className="loading-container">
        <h1>Conectando...</h1>
      </div>
    );
  }

  return (
    <div className="twokeys-container">
      <div className="pixel-bg"></div>
      {currentView === 'lobby' && (
        <div className="pixel-lobby">
          <Lobby
            sessionCode={sessionCode}
            myRole={myRole}
            playerA={state.playerA}
            playerB={state.playerB}
            onClaimRole={handleClaimRole}
            onReleaseRole={handleReleaseRole}
            onToggleReady={handleToggleReady}
            onStart={handleStart}
            onColorChange={handleColorChange}
            playerColor={state.gomoku?.playerColor}
            aiColor={state.gomoku?.aiColor}
            countdownMs={state.countdownMs}
            onExit={() => handleExitToMainboard(false)}
            defaultRole={defaultRole}
          />
        </div>
      )}

      {currentView === 'briefing' && (
        <Briefing countdownMs={state.countdownMs} />
      )}

      {(currentView === 'active' || currentView === 'finished') && (
        <GomokuGame
          state={state}
          myRole={myRole}
          onMove={handleMove}
          onReset={handleReset}
          onSendChat={handleSendChat}
          onExit={handleExitConfirm}
        />
      )}

      {showDialog && (
        <PixelDialog
          type={showDialog.type}
          title={showDialog.title}
          message={showDialog.message}
          confirmText={showDialog.confirmText}
          cancelText={showDialog.cancelText}
          onConfirm={showDialog.onConfirm}
          onCancel={showDialog.onCancel}
        />
      )}
    </div>
  );
}

export default App;
