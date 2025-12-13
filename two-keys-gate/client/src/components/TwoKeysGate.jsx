import { useState, useEffect } from 'react';
import useLocalGame from '../hooks/useLocalGame';
import useMultiplayerGame from '../hooks/useMultiplayerGame';
import Lobby from './Lobby';
import Briefing from './Briefing';
import Level1 from './Level1';
import SuccessScreen from './SuccessScreen';
import PixelDialog from './PixelDialog';
import '../styles/twokeys.css';

const resolveMode = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const queryMode = urlParams.get('mode')?.toLowerCase();
    if (queryMode === 'multi' || queryMode === 'local') {
      return queryMode;
    }
  }
  const envMode =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_DEFAULT_MODE?.toLowerCase()
      : undefined;
  return envMode === 'multi' ? 'multi' : 'local';
};

const TwoKeysGateView = ({
  mode,
  state,
  error,
  connected,
  myRole,
  sessionCode,
  sendMessage,
  leaveRoom,
}) => {
  const [showDialog, setShowDialog] = useState(null);

  useEffect(() => {
    // placeholder for future effects
  }, []);

  const handleExitToMainboard = () => {
    leaveRoom?.();
    // Navigate back to mainboard
    window.location.href = '/';
  };

  const handleExitConfirm = () => {
    setShowDialog({
      type: 'confirm',
      title: 'Salir del Desafío',
      message: '¿Quieres salir del desafío? Puedes volver cuando quieras.',
      confirmText: 'Salir',
      cancelText: 'Quedarme',
      onConfirm: () => {
        setShowDialog(null);
        handleExitToMainboard();
      },
      onCancel: () => setShowDialog(null),
    });
  };

  // Render loading state
  if (!connected && !error) {
    return (
      <div className="pixel-lobby">
        <div className="pixel-bg"></div>
        <Lobby
          sessionCode={sessionCode}
          myRole={myRole}
          playersConnected={state?.playersConnected || 0}
          mode={mode}
        />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="pixel-lobby">
        <div className="pixel-bg"></div>
        <div className="lobby-container">
          <h1 className="lobby-title">ERROR</h1>
          <p style={{ color: 'var(--pixel-red)', margin: '20px 0' }}>
            {error.message || 'Ha ocurrido un error'}
          </p>
          <button
            className="pixel-button large"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Render game based on phase
  if (!state) {
    return (
      <div className="pixel-lobby">
        <div className="pixel-bg"></div>
        <div className="lobby-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  const renderPhase = () => {
    const phase = state?.phase || 'lobby';

    switch (phase) {
      case 'lobby':
        return (
          <Lobby
            sessionCode={sessionCode}
            myRole={myRole}
            playersConnected={state.playersConnected}
            playerAReady={state.playerA?.isReady}
            playerBReady={state.playerB?.isReady}
            onPlayerReady={() => sendMessage('player_ready')}
            mode={mode}
            onExit={handleExitConfirm}
          />
        );

      case 'briefing':
        return (
          <Briefing
            onStart={() => sendMessage('start_game')}
            onExit={handleExitConfirm}
          />
        );

      case 'active':
      case 'sync_confirm':
      case 'retry':
        return (
          <Level1
            state={state}
            myRole={myRole}
            sendMessage={sendMessage}
            onExit={handleExitConfirm}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            message={state.resultMessage}
            onContinue={handleExitToMainboard}
          />
        );

      default:
        return (
          <div className="pixel-lobby">
            <div className="pixel-bg"></div>
            <div className="lobby-container">
              <h1 className="lobby-title">RECONEXIÓN</h1>
              <p style={{ color: 'var(--pixel-white)', marginBottom: '15px' }}>
                Estado desconocido. Intentando sincronizar...
              </p>
              <button
                className="pixel-button large"
                onClick={() => window.location.reload()}
              >
                Recargar
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="twokeys-container">
      <div className="pixel-bg"></div>
      {showDialog && (
        <PixelDialog
          type={showDialog.type}
          title={showDialog.title}
          message={showDialog.message}
          onConfirm={showDialog.onConfirm}
          onCancel={showDialog.onCancel}
          confirmText={showDialog.confirmText}
          cancelText={showDialog.cancelText}
        />
      )}
      {renderPhase()}
    </div>
  );
};

const TwoKeysGateLocal = ({ mode }) => {
  const game = useLocalGame();
  return <TwoKeysGateView mode={mode} {...game} />;
};

const TwoKeysGateMultiplayer = ({ mode, serverUrl }) => {
  const game = useMultiplayerGame(serverUrl, true);
  return <TwoKeysGateView mode={mode} {...game} />;
};

const TwoKeysGate = () => {
  const [mode] = useState(resolveMode);
  const serverUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COLYSEUS_URL) ||
    'ws://localhost:3001';

  return mode === 'multi'
    ? <TwoKeysGateMultiplayer mode={mode} serverUrl={serverUrl} />
    : <TwoKeysGateLocal mode={mode} />;
};

export default TwoKeysGate;
