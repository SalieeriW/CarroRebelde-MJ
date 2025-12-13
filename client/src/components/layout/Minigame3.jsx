import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/game.css";

const DEFAULT_TILE_SIZE = 40;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 10;

const EMPTY = 0;
const WALL = 1;

const initialGrid = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const initialBoxes = [
  { id: "b1", x: 3, y: 2, type: "normal" },
  { id: "b2", x: 5, y: 4, type: "player1" },
  { id: "b3", x: 7, y: 6, type: "player2" },
];

const initialTargets = [
  { x: 8, y: 2 },
  { x: 8, y: 4 },
  { x: 8, y: 6 },
];

const initialPlayer1 = { x: 1, y: 1 };
const initialPlayer2 = { x: 1, y: 8 };

function inBounds(x, y) {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

const Minigame3 = ({ gameData, onGameUpdate }) => {
  const canvasRef = useRef(null);

  const [grid] = useState(initialGrid);
  const [targets] = useState(initialTargets);

  const [boxes, setBoxes] = useState(initialBoxes);
  const [player1, setPlayer1] = useState(initialPlayer1);
  const [player2, setPlayer2] = useState(initialPlayer2);
  const [gameWon, setGameWon] = useState(false);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);

  const targetSet = useMemo(() => {
    const s = new Set();
    targets.forEach((t) => s.add(`${t.x},${t.y}`));
    return s;
  }, [targets]);

  // Responsive tile size
  useEffect(() => {
    const updateSize = () => {
      const newTileSize = Math.floor(window.innerWidth / GRID_WIDTH);
      setTileSize(Math.max(newTileSize, 20)); // minimum 20
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const checkWin = useCallback(() => {
    return (
      boxes.length > 0 && boxes.every((b) => targetSet.has(`${b.x},${b.y}`))
    );
  }, [boxes, targetSet]);

  const restartGame = useCallback(() => {
    setBoxes([...initialBoxes]);
    setPlayer1({ ...initialPlayer1 });
    setPlayer2({ ...initialPlayer2 });
    setGameWon(false);
    onGameUpdate?.({ ...(gameData || {}), minigame3Won: false });
  }, [onGameUpdate, gameData]);

  useEffect(() => {
    if (!gameWon && checkWin()) {
      setGameWon(true);
      onGameUpdate?.({ ...(gameData || {}), minigame3Won: true });
    }
  }, [checkWin, gameWon, onGameUpdate, gameData]);

  const boxAt = useCallback(
    (x, y) => boxes.findIndex((b) => b.x === x && b.y === y),
    [boxes]
  );

  const movePlayer = useCallback(
    (player, setPlayer, dx, dy, playerType) => {
      const newX = player.x + dx;
      const newY = player.y + dy;

      if (!inBounds(newX, newY)) return;

      if (grid[newY][newX] === WALL) return;

      const idx = boxAt(newX, newY);
      if (idx !== -1) {
        const box = boxes[idx];

        if (
          (box.type === "player1" && playerType !== "player1") ||
          (box.type === "player2" && playerType !== "player2")
        ) {
          return;
        }

        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        if (!inBounds(boxNewX, boxNewY)) return;

        if (grid[boxNewY][boxNewX] === WALL) return;

        if (boxAt(boxNewX, boxNewY) !== -1) return;

        const otherPlayer = playerType === "player1" ? player2 : player1;
        if (otherPlayer.x === boxNewX && otherPlayer.y === boxNewY) return;

        setBoxes((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], x: boxNewX, y: boxNewY };
          return next;
        });
      }

      setPlayer({ x: newX, y: newY });
    },
    [grid, boxes, boxAt, player1, player2]
  );

  const handleKeyDown = useCallback(
    (e) => {
      const key = e.key;
      const k = key.length === 1 ? key.toLowerCase() : key;

      let used = true;

      if (k === "r") {
        restartGame();
      } else if (!gameWon) {
        switch (k) {
          case "w":
            movePlayer(player1, setPlayer1, 0, -1, "player1");
            break;
          case "s":
            movePlayer(player1, setPlayer1, 0, 1, "player1");
            break;
          case "a":
            movePlayer(player1, setPlayer1, -1, 0, "player1");
            break;
          case "d":
            movePlayer(player1, setPlayer1, 1, 0, "player1");
            break;

          case "ArrowUp":
            movePlayer(player2, setPlayer2, 0, -1, "player2");
            break;
          case "ArrowDown":
            movePlayer(player2, setPlayer2, 0, 1, "player2");
            break;
          case "ArrowLeft":
            movePlayer(player2, setPlayer2, -1, 0, "player2");
            break;
          case "ArrowRight":
            movePlayer(player2, setPlayer2, 1, 0, "player2");
            break;

          default:
            used = false;
        }
      } else {
        used = false;
      }

      if (used) e.preventDefault();
    },
    [gameWon, player1, player2, movePlayer, restartGame]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = GRID_WIDTH * tileSize;
    canvas.height = GRID_HEIGHT * tileSize;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#e2e8f0");
    gradient.addColorStop(1, "#cbd5e0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const px = x * tileSize;
        const py = y * tileSize;

        if (grid[y][x] === WALL) {
          // Wall
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = "#654321";
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, tileSize, tileSize);
          // Brick line
          ctx.strokeStyle = "#A0522D";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py + tileSize / 2);
          ctx.lineTo(px + tileSize, py + tileSize / 2);
          ctx.stroke();
        } else {
          // Floor
          ctx.fillStyle = "#4a5568";
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = "#2d3748";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, tileSize, tileSize);
        }
      }
    }

    targets.forEach((t) => {
      const px = t.x * tileSize;
      const py = t.y * tileSize;
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(px + 5, py + 5, tileSize - 10, tileSize - 10);
      ctx.strokeStyle = "#FFA500";
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 5, py + 5, tileSize - 10, tileSize - 10);
    });

    boxes.forEach((box) => {
      const px = box.x * tileSize;
      const py = box.y * tileSize;
      const isOnTarget = targetSet.has(`${box.x},${box.y}`);

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

      let boxColor = "#8B4513";
      if (box.type === "player1") boxColor = "#DC143C";
      else if (box.type === "player2") boxColor = "#4169E1";

      ctx.fillStyle = isOnTarget ? "#228B22" : boxColor;
      ctx.fillRect(px + 5, py + 5, tileSize - 10, tileSize - 10);

      ctx.strokeStyle = "#654321";
      if (box.type === "player1") ctx.strokeStyle = "#B22222";
      else if (box.type === "player2") ctx.strokeStyle = "#00008B";

      ctx.lineWidth = 2;
      ctx.strokeRect(px + 5, py + 5, tileSize - 10, tileSize - 10);

      ctx.strokeStyle = "#A0522D";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 10);
      ctx.lineTo(px + tileSize - 10, py + tileSize - 10);
      ctx.moveTo(px + tileSize - 10, py + 10);
      ctx.lineTo(px + 10, py + tileSize - 10);
      ctx.stroke();
    });

    function drawPlayer(p, fill, stroke) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(
        p.x * tileSize + tileSize / 2 + 2,
        p.y * tileSize + tileSize / 2 + 2,
        (tileSize - 20) / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(
        p.x * tileSize + tileSize / 2,
        p.y * tileSize + tileSize / 2,
        (tileSize - 20) / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawPlayer(player1, "#FF6B6B", "#C44569");
    drawPlayer(player2, "#4ECDC4", "#26A69A");

    if (gameWon) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("¡Ganaste!", canvas.width / 2, canvas.height / 2 + 10);
    }
  }, [grid, boxes, targets, player1, player2, gameWon, targetSet, tileSize]);

  return (
    <div className="pixel-view">
      <div className="pixel-bg"></div>
      <div className="view-title">MINIGAME 3 - Puzzle Cooperativo</div>

      <div className="driver-container">
        <canvas ref={canvasRef} className="driver-canvas" />
        <div className="game-instructions">
          <p>Jugador 1: WASD | Jugador 2: Flechas</p>
          <p>
            Empuja las cajas a los cuadrados amarillos. Cajas marrones: ambos,
            Rojas: solo Jugador 1, Azules: solo Jugador 2.
          </p>
          <p>¡Cooperen para completar el puzzle!</p>
          <button
            onClick={restartGame}
            className="restart-button"
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--pixel-red)",
              color: "var(--pixel-white)",
              border: "3px solid var(--pixel-white)",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "10px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Reiniciar (R)
          </button>
          {gameWon && (
            <p>¡Felicidades! Han completado el puzzle cooperativo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Minigame3;
