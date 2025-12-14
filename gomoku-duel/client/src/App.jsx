import React, { useState, useEffect } from 'react';
import useMultiplayerGame from './hooks/useMultiplayerGame';
import Lobby from './components/Lobby';
import Briefing from './components/Briefing';
import GomokuGame from './components/GomokuGame';

function App() {
  const defaultRole = import.meta.env.VITE_DEFAULT_ROLE || null;
  const [preferredRole, setPreferredRole] = useState(defaultRole);
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

  const handleExit = () => {
    leaveRoom();
    window.location.href = '/';
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
            onExit={handleExit}
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
          onExit={handleExit}
        />
      )}
    </div>
  );
}

export default App;
