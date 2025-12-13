import React from 'react';

const Lobby = ({
  sessionCode,
  myRole,
  playersConnected,
  playerAReady,
  playerBReady,
  onPlayerReady,
  onExit,
  mode = 'local'
}) => {
  const isMultiplayer = mode === 'multi';

  // Initial lobby (waiting for assignment)
  if (!myRole) {
    return (
      <div className="lobby-container">
        <h1 className="lobby-title">
          {isMultiplayer ? 'CONECTANDO AL SERVIDOR' : 'MODO LOCAL'}
        </h1>
        <p className="lobby-subtitle">
          {isMultiplayer
            ? 'Esperando conexión con la sala en el servidor...'
            : 'Abre dos ventanas con la misma URL.'}
        </p>
        <div className="lobby-section">
          <div className="section-header">
            {isMultiplayer ? 'Sincronizando...' : 'Emparejando...'}
          </div>
          <p style={{ fontSize: '10px', color: 'var(--pixel-white)', lineHeight: '1.6' }}>
            {isMultiplayer
              ? 'Asignaremos Jugador A / B automáticamente cuando ambos clientes estén conectados.'
              : 'Este modo no usa servidor ni códigos. El primer navegador será Jugador A, el segundo será Jugador B.'}
          </p>
        </div>
      </div>
    );
  }

  // Waiting room (room created/joined, waiting for both players)
  return (
    <div className="lobby-container">
      <h1 className="lobby-title">
        SALA DE ESPERA {isMultiplayer ? '(Online)' : '(Local)'}
      </h1>

      {/* Session Code Display */}
      <div className="lobby-section">
        <div className="section-header">Código</div>
        <div className="session-code-display">
          {sessionCode}
        </div>
        <p className="session-code-hint">
          {isMultiplayer
            ? 'Comparte este código si necesitas que otro cliente se una a la misma sala.'
            : 'Modo local: sin servidor'}
        </p>
      </div>

      {/* Player Status */}
      <div className="lobby-section">
        <div className="section-header">Jugadores</div>
        <div className="players-list">
          <div className={`player-item ${playerAReady ? 'ready' : ''}`}>
            <div className="player-info">
              <div className="player-role">JUGADOR A</div>
              <div className="player-name">
                {myRole === 'A' ? '(Tú)' : playersConnected >= 1 ? 'Conectado' : 'Esperando...'}
              </div>
            </div>
            <div className="player-status">
              {playerAReady ? '✓ LISTO' : playersConnected >= 1 ? 'ESPERANDO' : '-'}
            </div>
          </div>

          <div className={`player-item ${playerBReady ? 'ready' : ''}`}>
            <div className="player-info">
              <div className="player-role">JUGADOR B</div>
              <div className="player-name">
                {myRole === 'B' ? '(Tú)' : playersConnected >= 2 ? 'Conectado' : 'Esperando...'}
              </div>
            </div>
            <div className="player-status">
              {playerBReady ? '✓ LISTO' : playersConnected >= 2 ? 'ESPERANDO' : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Ready Button */}
      {playersConnected >= 2 && myRole && (
        <div className="lobby-section">
          {!((myRole === 'A' && playerAReady) || (myRole === 'B' && playerBReady)) ? (
            <button className="pixel-button large" onClick={onPlayerReady}>
              Estoy Listo
            </button>
          ) : (
            <div className="waiting-message">
              Esperando al otro jugador...
            </div>
          )}
        </div>
      )}

      {/* Exit Button */}
      {onExit && (
        <div className="lobby-section">
          <button className="pixel-button small exit-button" onClick={onExit}>
            Volver al Tablero
          </button>
        </div>
      )}
    </div>
  );
};

export default Lobby;
