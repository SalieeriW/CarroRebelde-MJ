import { useMemo, useState } from 'react';
import levelsData from '../../shared/minerLevels.json';
import useMinerGame from './hooks/useMinerGame';

const prettyWeight = {
  light: 'Ligero',
  medium: 'Medio',
  heavy: 'Pesado',
  very_heavy: 'Muy pesado',
};

const prettySpecial = {
  slow: 'Ralentiza',
  speed_buff: 'Acelera',
  combo: 'Combo +5',
  next_bonus: 'Siguiente +5',
};

const phaseCopy = {
  lobby: 'Sala',
  briefing: 'Preparación',
  active: 'En juego',
  success: 'Nivel superado',
  summary: 'Sin turnos',
};

const App = () => {
  const game = useMinerGame();
  const [selected, setSelected] = useState(null);
  const [chatText, setChatText] = useState('');

  const isA = game.myRole === 'A';
  const isB = game.myRole === 'B';
  const phase = game.state?.phase || 'lobby';

  const levelMeta = useMemo(() => {
    if (!game.state) return null;
    return levelsData.levels.find((lvl) => lvl.id === game.state.levelId) || null;
  }, [game.state]);

  const availableObjects = useMemo(() => {
    if (!game.state) return [];
    const objs = (game.state.objects || []).slice();
    for (let i = objs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [objs[i], objs[j]] = [objs[j], objs[i]];
    }
    return objs;
  }, [game.state?.objects]);

  const status = game.state ? `${game.state.score}/${game.state.goalScore} pts` : '...';
  const levelInfo = game.state ? `Nivel ${game.state.levelId}/${game.state.totalLevels || 3}` : '';
  const turnsLeft = game.state?.turnsLeft ?? 0;

  const handleHook = (id) => {
    if (!isA) return;
    game.hook(id).catch(console.error);
  };

  const handleMark = (id) => {
    if (!isB) return;
    setSelected(id);
    game.markTarget(id).catch(console.error);
  };

  const sendChat = () => {
    if (!chatText.trim()) return;
    game.sendChat(chatText.trim()).catch(console.error);
    setChatText('');
  };

  const seatStatus = (role) => {
    const player = role === 'A' ? game.state?.playerA : game.state?.playerB;
    const isMe = game.myRole === role;
    const occupied = !!player?.sessionId;
    return {
      occupied,
      ready: !!player?.isReady,
      label: occupied ? (isMe ? 'Tú' : 'Ocupado') : 'Libre',
    };
  };

  const renderLobby = () => {
    const aStatus = seatStatus('A');
    const bStatus = seatStatus('B');
    return (
      <div className="pixel-lobby">
        <div className="pixel-bg" />
        <div className="lobby-container">
          <div className="lobby-title">Golden Miner · Co-op</div>
          <div className="lobby-subtitle">Dos roles, un gancho. Coordinen para llegar a la meta.</div>

          <div className="lobby-section">
            <div className="section-header">Descripción del reto</div>
            <p>Recolecten {game.state?.goalScore || 0} puntos en equipo sin perder turnos. A dispara el gancho; B marca prioridades y lee la tabla de valores.</p>
            <p className="hint">
              {levelInfo} · Objetivo: {status} · Turnos previstos: {levelMeta?.turns || '—'}
            </p>
            {levelMeta?.hints?.generic && <p className="hint">{levelMeta.hints.generic}</p>}
          </div>

          <div className="lobby-section">
            <div className="section-header">Asientos y roles</div>
            <div className="roles-grid">
              <div className={`player-item ${aStatus.ready ? 'ready' : ''}`}>
                <div>
                  <div className="seat-title">Jugador A · Operador</div>
                  <div className="seat-desc">Controla el gancho y ejecuta la captura.</div>
                  <div className="seat-status">Estado: {aStatus.label} · Listo: {aStatus.ready ? 'Sí' : 'No'}</div>
                </div>
                <div className="seat-actions">
                  <button className="pixel-button small" onClick={() => game.claimRole('A')}>Tomar A</button>
                  <button className="pixel-button small" onClick={game.releaseRole}>Liberar</button>
                </div>
              </div>

              <div className={`player-item ${bStatus.ready ? 'ready' : ''}`}>
                <div>
                  <div className="seat-title">Jugador B · Guía</div>
                  <div className="seat-desc">Ve valores y efectos, marca la prioridad.</div>
                  <div className="seat-status">Estado: {bStatus.label} · Listo: {bStatus.ready ? 'Sí' : 'No'}</div>
                </div>
                <div className="seat-actions">
                  <button className="pixel-button small" onClick={() => game.claimRole('B')}>Tomar B</button>
                  <button className="pixel-button small" onClick={game.releaseRole}>Liberar</button>
                </div>
              </div>
            </div>
            <p className="hint">Ambos deben estar sentados y listos antes de empezar.</p>
          </div>

          <div className="lobby-section">
            <div className="section-header">Inicio rápido</div>
            <div className="meta-grid">
              <span className="pill">Nivel {game.state?.levelId}/{game.state?.totalLevels || 3}</span>
              <span className="pill">Meta {game.state?.goalScore || 0} pts</span>
              <span className="pill">Fase: {phaseCopy[phase]}</span>
            </div>
            <div className="action-row">
              <button className="pixel-button" onClick={() => game.setReady(true)} disabled={!game.myRole}>Estoy listo</button>
              <button className="pixel-button" onClick={() => game.setReady(false)} disabled={!game.myRole}>No listo</button>
              <button
                className="pixel-button"
                onClick={game.start}
                disabled={!game.state?.playerA?.sessionId || !game.state?.playerB?.sessionId}
              >
                Empezar nivel
              </button>
              <button className="pixel-button small" onClick={game.reset}>Reset sala</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusBanner = () => {
    if (phase === 'success') {
      const final = game.state?.levelId === game.state?.totalLevels;
      return (
        <div className="status-banner success">
          {final ? 'Sesión completada, reinicia cuando quieras.' : 'Nivel superado, preparando el siguiente...'}
        </div>
      );
    }
    if (phase === 'summary') {
      return (
        <div className="status-banner warn">
          Turnos agotados. Pulsa “Reintentar” para seguir en el mismo nivel.
        </div>
      );
    }
    return null;
  };

  const renderGame = () => (
    <div className="level-view">
      <div className="pixel-bg" />
      <div className="level-top-bar">
        <div>
          <div className="level-title">Golden Miner · {levelMeta?.name || 'Nivel'}</div>
          <div className="meta-line">{levelInfo} · Objetivo {game.state?.goalScore || 0} pts</div>
        </div>
        <div className="top-actions">
          <span className="pill">Puntos: {game.state?.score ?? 0}</span>
          <span className="pill">Turnos: {turnsLeft}</span>
          <span className="pill">Fase: {phaseCopy[phase]}</span>
          <button className="pixel-button small" onClick={() => game.claimRole('A')}>Tomar A</button>
          <button className="pixel-button small" onClick={() => game.claimRole('B')}>Tomar B</button>
          <button className="pixel-button small" onClick={game.releaseRole}>Liberar</button>
          <button className="pixel-button small" onClick={() => game.setReady(true)} disabled={!game.myRole}>Listo</button>
          <button className="pixel-button small" onClick={game.start}>Reintentar</button>
          <button className="pixel-button small" onClick={game.reset}>Reset sala</button>
        </div>
      </div>

      {renderStatusBanner()}

      <div className="level-container">
        <div className="panel">
          <div className="section-header">Operador A · Objetos visibles</div>
          <p className="hint">A dispara el gancho. B marca prioridades, pero A decide si no hay marca.</p>
          <div className="objects-grid">
            {availableObjects.map((obj) => (
              <div
                key={obj.id}
                className={`object ${obj.taken ? 'taken' : ''} ${selected === obj.id ? 'selected' : ''}`}
                onClick={() => {
                  if (isA) handleHook(obj.id);
                  if (isB) handleMark(obj.id);
                  setSelected(obj.id);
                }}
              >
                <div className="object-icon">{obj.icon}</div>
                <div className="object-meta">{obj.size} · {obj.weight}</div>
                {obj.id === selected && <div className="badge">Selección</div>}
                {obj.taken && <div className="badge">Tomado</div>}
              </div>
            ))}
          </div>
          <div className="action-row">
            {isA && <button className="pixel-button" onClick={() => handleHook(selected)} disabled={!selected}>Disparar gancho</button>}
            {isB && <button className="pixel-button" onClick={() => handleMark(selected)} disabled={!selected}>Marcar objetivo</button>}
          </div>
          {game.state?.lastHit && (
            <div className="hint">Último: {game.state.lastHit.type} (+{game.state.lastHit.value}) → {game.state.lastHit.scoreAfter} pts</div>
          )}
        </div>

        <div className="panel">
          <div className="section-header">Guía B · Valores y efectos</div>
          <ul className="ref-list">
            {(game.state?.objects || []).map((obj) => (
              <li key={`ref-${obj.id}`}>
                <span className="pill small">{obj.icon}</span>
                <span>{prettyWeight[obj.weight] || obj.weight}</span>
                <span className="pill small value">+{obj.value} pts</span>
                {obj.special && <span className="pill small special">{prettySpecial[obj.special] || obj.special}</span>}
              </li>
            ))}
          </ul>

          <div className="section-header">Chat rápido</div>
          <div className="chat">
            {(game.state?.chatMessages || []).map((msg, idx) => (
              <div key={idx} className="chat-line">
                <strong>{msg.role}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-row">
            <input
              className="pixel-input"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Mensaje corto…"
            />
            <button className="pixel-button small" onClick={sendChat}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleted = (final = false) => (
    <div className="pixel-lobby">
      <div className="pixel-bg" />
      <div className="lobby-container">
        <div className="lobby-title">{final ? 'Sesión terminada' : 'Nivel superado'}</div>
        <p className="hint">Marcador: {status}</p>
        <div className="action-row">
          <button className="pixel-button" onClick={game.reset}>Reiniciar desde nivel 1</button>
          {!final && <button className="pixel-button" onClick={game.start}>Repetir nivel</button>}
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="pixel-lobby">
      <div className="pixel-bg" />
      <div className="lobby-container">
        <div className="lobby-title">Intento terminado</div>
        <p className="hint">Puntuación: {status} · Turnos agotados.</p>
        <div className="action-row">
          <button className="pixel-button" onClick={game.start}>Reintentar nivel</button>
          <button className="pixel-button" onClick={game.reset}>Reset sala</button>
        </div>
      </div>
    </div>
  );

  const finalLevel = game.state?.levelId === game.state?.totalLevels && phase === 'success';

  return (
    <div className="twokeys-container">
      {phase === 'lobby' || phase === 'briefing' ? renderLobby()
        : phase === 'success' && finalLevel
          ? renderCompleted(true)
          : phase === 'summary'
            ? renderSummary()
            : phase === 'success'
              ? renderCompleted(false)
              : renderGame()}

      {game.error && (
        <div className="status-banner warn">
          Error: {game.error.message || 'Desconocido'}
        </div>
      )}
    </div>
  );
};

export default App;
