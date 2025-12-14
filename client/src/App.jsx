import * as Colyseus from "colyseus.js";
import { useCallback, useEffect, useState } from "react";
import Lobby from "./components/layout/Lobby";
import Minigame1 from "./components/layout/Minigame1";
import Minigame2 from "./components/layout/Minigame2";
import Minigame3 from "./components/layout/Minigame3";
import Minigame4 from "./components/layout/Minigame4";
import Minigame5 from "./components/layout/Minigame5";
import Minigame6 from "./components/layout/Minigame6";
import "./styles/game.css";
import TestPage from "./TestPage";

// Configurar cliente Colyseus
const getServerURL = () => {
  return import.meta.env.VITE_MINIGAME_SERVER_URL || "ws://localhost:3000";
};

const client = new Colyseus.Client(getServerURL());

function App() {
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentMinigame, setCurrentMinigame] = useState(null);
  const [myRole, setMyRole] = useState("");
  const [mySessionId, setMySessionId] = useState("");
  const [gamePhase, setGamePhase] = useState("waiting");
  const [gameData, setGameData] = useState({});
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const isTestMode = urlParams.get("test") === "true";

  if (isTestMode) {
    return <TestPage />;
  }
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Verificar si venimos de una redirección con roomCode
    const minigameId = urlParams.get("game");
    const urlRoomCode = urlParams.get("roomCode");

    if (minigameId && urlRoomCode) {
      // Auto-conectar si venimos del juego principal
      setCurrentMinigame(parseInt(minigameId));
      handleJoinRoom(urlRoomCode);
    } else if (minigameId) {
      setCurrentMinigame(parseInt(minigameId));
    }
  }, []);

  const setupRoomListeners = useCallback((r) => {
    // Actualizar estado cuando cambie
    r.onStateChange((state) => {
      setGamePhase(state.gamePhase);
      setRoomCode(state.roomCode);
      setCurrentMinigame(state.selectedMinigame);

      // Parsear gameData
      try {
        setGameData(JSON.parse(state.gameData || "{}"));
      } catch (e) {
        setGameData({});
      }

      // Obtener lista de jugadores
      const playerList = [];
      state.players.forEach((player, sessionId) => {
        playerList.push({
          sessionId,
          role: player.role,
          connected: player.connected,
        });
      });
      setPlayers(playerList);

      // Determinar mi rol
      const me = state.players.get(r.sessionId);
      if (me) {
        setMyRole(me.role);
      }
    });

    // Escuchar inicio de minijuego
    r.onMessage("minigame_started", (data) => {
      console.log("Minigame started!", data);
      setMyRole(data.roles[r.sessionId]);
    });

    // Escuchar actualizaciones de dibujo (para Pictionary)
    r.onMessage("drawing_update", (data) => {
      setGameData((prev) => ({ ...prev, drawingData: data.data }));
    });

    // Escuchar resultados de adivinanza
    r.onMessage("guess_result", (data) => {
      setGameData((prev) => ({
        ...prev,
        lastGuess: data.guess,
        guessCorrect: data.correct,
      }));
    });

    // Escuchar actualización de palabras (para Wordle)
    r.onMessage("word_update", (data) => {
      setGameData((prev) => ({ ...prev, wordUpdate: data }));
    });

    // Escuchar finalización del minijuego
    r.onMessage("minigame_complete", (data) => {
      console.log("Minigame complete!", data);
      // Mostrar resultados
      alert(`Game Over! Score: ${data.score}, Success: ${data.success}`);

      // Volver al juego principal después de 3 segundos
      setTimeout(() => {
        const mainRoomId = sessionStorage.getItem("mainGameRoomId");
        if (mainRoomId) {
          window.location.href = `http://localhost:5174/?rejoin=${mainRoomId}`;
        }
      }, 3000);
    });

    r.onMessage("game_paused", (data) => {
      alert("Game paused: " + data.reason);
    });

    r.onError((code, message) => {
      console.error("Room error:", code, message);
    });

    r.onLeave((code) => {
      console.log("Left room:", code);
      setConnected(false);
      setRoom(null);
    });
  }, []);

  const handleCreateRoom = useCallback(async () => {
    try {
      const minigameId = currentMinigame || 1;
      const r = await client.create("minigame_room", { minigameId });

      console.log("Created room:", r.sessionId);
      console.log("Room code:", r.state.roomCode); // ← IMPORTANTE: Verifica esto
      console.log("Room ID:", r.id); // ← Y esto también
      setRoom(r);
      setMySessionId(r.sessionId);
      setConnected(true);
      setupRoomListeners(r);
    } catch (e) {
      console.error("Create room error:", e);
      alert("Error creating room: " + e.message);
    }
  }, [currentMinigame, setupRoomListeners]);

  const handleJoinRoom = useCallback(
    async (code) => {
      try {
        // Buscar room por código
        const response = await fetch(
          `${getServerURL().replace("ws://", "http://")}/rooms/${code}`
        );

        if (!response.ok) {
          throw new Error("Room not found");
        }

        const roomInfo = await response.json();

        // Unirse a la room por ID
        const r = await client.joinById(roomInfo.roomId);

        console.log("Joined room:", r.sessionId);
        setRoom(r);
        setMySessionId(r.sessionId);
        setConnected(true);
        setupRoomListeners(r);
      } catch (e) {
        console.error("Join room error:", e);
        alert("Failed to join room: " + e.message);
      }
    },
    [setupRoomListeners]
  );

  const handleGameUpdate = useCallback(
    (data) => {
      if (room && gamePhase === "playing") {
        room.send("game_update", data);
      }
    },
    [room, gamePhase]
  );

  const handlePlayerAction = useCallback(
    (actionData) => {
      if (room && gamePhase === "playing") {
        room.send("player_action", actionData);
      }
    },
    [room, gamePhase]
  );

  const handleStartGame = useCallback(() => {
    if (room) {
      room.send("start_minigame");
    }
  }, [room]);

  // Si no está conectado, mostrar lobby
  if (!connected) {
    return (
      <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
    );
  }

  // Si está en waiting, mostrar sala de espera
  if (gamePhase === "waiting") {
    return (
      <div className="pixel-lobby">
        <div className="pixel-bg"></div>
        <div className="lobby-container">
          <h1 className="lobby-title">ROOM CODE</h1>

          {/* MOSTRAR EL CÓDIGO GRANDE Y CLARO */}
          <div
            style={{
              fontSize: "48px",
              fontFamily: "Press Start 2P",
              color: "#00ff41",
              margin: "20px 0",
              padding: "20px",
              background: "rgba(0,255,65,0.1)",
              border: "3px solid #00ff41",
            }}
          >
            {roomCode || "LOADING..."}
          </div>

          <p className="lobby-subtitle">Share this code with other players!</p>
          <p className="lobby-subtitle">Minigame {currentMinigame}</p>

          <div className="lobby-section">
            <div className="section-header">Players: {players.length}/2</div>
            <div className="players-list">
              {players.map((player) => (
                <div key={player.sessionId} className="player-item">
                  <span className="player-role">
                    {player.role.toUpperCase()}
                  </span>
                  <span className="player-status">
                    {player.connected ? "●" : "○"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {players.length >= 2 && (
            <button className="pixel-button large" onClick={handleStartGame}>
              START GAME
            </button>
          )}

          {players.length < 2 && (
            <div className="lobby-subtitle" style={{ marginTop: "20px" }}>
              Waiting for {2 - players.length} more player
              {2 - players.length > 1 ? "s" : ""}...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderizar minijuego activo
  const minigameProps = {
    gameData,
    onGameUpdate: handleGameUpdate,
    onPlayerAction: handlePlayerAction,
    myRole,
    mySessionId,
    players,
    room,
  };

  const renderMinigame = () => {
    switch (currentMinigame) {
      case 1:
        return <Minigame1 {...minigameProps} />;
      case 2:
        return <Minigame2 {...minigameProps} />;
      case 3:
        return <Minigame3 {...minigameProps} />;
      case 4:
        return <Minigame4 {...minigameProps} />;
      case 5:
        return <Minigame5 {...minigameProps} />;
      case 6:
        return <Minigame6 {...minigameProps} />;
      default:
        return <div>Invalid minigame</div>;
    }
  };

  return <div className="game-container">{renderMinigame()}</div>;
}

export default App;
