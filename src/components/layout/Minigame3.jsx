import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/game.css";

const TILE_SIZE = 40;
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

  const targetSet = useMemo(() => {
    const s = new Set();
    targets.forEach((t) => s.add(`${t.x},${t.y}`));
    return s;
  }, [targets]);

  const checkWin = useCallback(() => {
    return (
      boxes.length > 0 && boxes.every((b) => targetSet.has(`${b.x},${b.y}`))
    );
  }, [boxes, targetSet]);

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
      if (gameWon) return;

      const key = e.key;
      const k = key.length === 1 ? key.toLowerCase() : key;

      let used = true;

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

      if (used) e.preventDefault();
    },
    [gameWon, player1, player2, movePlayer]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = GRID_WIDTH * TILE_SIZE;
    canvas.height = GRID_HEIGHT * TILE_SIZE;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#2c3e50");
    gradient.addColorStop(1, "#34495e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (grid[y][x] === WALL) {
          // Wall
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#654321";
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
          // Brick line
          ctx.strokeStyle = "#A0522D";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
          ctx.stroke();
        } else {
          // Floor
          ctx.fillStyle = "#4a5568";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#2d3748";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    targets.forEach((t) => {
      const px = t.x * TILE_SIZE;
      const py = t.y * TILE_SIZE;
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
      ctx.strokeStyle = "#FFA500";
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
    });

    boxes.forEach((box) => {
      const px = box.x * TILE_SIZE;
      const py = box.y * TILE_SIZE;
      const isOnTarget = targetSet.has(`${box.x},${box.y}`);

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);

      let boxColor = "#8B4513";
      if (box.type === "player1") boxColor = "#DC143C";
      else if (box.type === "player2") boxColor = "#4169E1";

      ctx.fillStyle = isOnTarget ? "#228B22" : boxColor;
      ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);

      ctx.strokeStyle = "#654321";
      if (box.type === "player1") ctx.strokeStyle = "#B22222";
      else if (box.type === "player2") ctx.strokeStyle = "#00008B";

      ctx.lineWidth = 2;
      ctx.strokeRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);

      ctx.strokeStyle = "#A0522D";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 10);
      ctx.lineTo(px + TILE_SIZE - 10, py + TILE_SIZE - 10);
      ctx.moveTo(px + TILE_SIZE - 10, py + 10);
      ctx.lineTo(px + 10, py + TILE_SIZE - 10);
      ctx.stroke();
    });

    function drawPlayer(p, fill, stroke) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(
        p.x * TILE_SIZE + TILE_SIZE / 2 + 2,
        p.y * TILE_SIZE + TILE_SIZE / 2 + 2,
        (TILE_SIZE - 20) / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(
        p.x * TILE_SIZE + TILE_SIZE / 2,
        p.y * TILE_SIZE + TILE_SIZE / 2,
        (TILE_SIZE - 20) / 2,
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
  }, [grid, boxes, targets, player1, player2, gameWon, targetSet]);

  return (
    <div className="pixel-view">
      <div className="pixel-bg"></div>
      <div className="view-title">MINIGAME 3 - Puzzle Cooperativo</div>

      <div className="driver-container">
        <canvas ref={canvasRef} className="driver-canvas" />
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <p>Jugador 1: WASD | Jugador 2: Flechas</p>
          <p>
            Empuja las cajas a los cuadrados amarillos. Cajas marrones: ambos,
            Rojas: solo Jugador 1, Azules: solo Jugador 2.
          </p>
          <p>¡Cooperen para completar el puzzle!</p>
          {gameWon && (
            <p>¡Felicidades! Han completado el puzzle cooperativo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Minigame3;
