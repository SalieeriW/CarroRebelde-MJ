import { useEffect, useRef, useState } from "react";
import "../../styles/game.css";

/**
 * RopeCoopGame - Real Elastic Rope Physics
 * - Player1: WASD + Space (hold to charge jump)
 * - Player2: Arrow keys + Enter (hold to charge jump)
 * - Rope: Continuous elastic physics with dead zone when players are close
 * - Platforms: Full collision detection (top, bottom, sides)
 * - World bounds: Collision from all directions
 * - Gravity: Pulls players down
 * - Jump: Charge power by holding jump key
 */

export default function RopeCoopGame({ gameData, onGameUpdate }) {
  const canvasRef = useRef(null);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const DPR = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const w = Math.min(900, window.innerWidth - 40);
      const h = Math.min(520, window.innerHeight - 200);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* =========================
       WORLD CONFIG
    ========================= */
    const world = {
      w: () => canvas.width / DPR,
      h: () => canvas.height / DPR,
      gravity: 0.65, // Slightly increased for shorter jumps
      airFriction: 0.92,
      groundFriction: 0.8,
      accel: 0.8,
      maxSpeed: 7,
      jumpChargeRate: 1.5,
      maxJumpPower: 20, // Further reduced for shorter jumps

      // Rope physics (MODE 2)
      restLength: 120, // Shorter rope for closer gameplay
      ropeK: 0.06, // Increased for tighter, more realistic rope
      ropeDamping: 0.35, // Increased damping for less oscillation
      maxRopeForce: 1.2, // Slightly reduced max force
      massFactor: 0.5, // Adjusted mass transmission
    };

    /* =========================
       ENTITIES
    ========================= */
    const makePlayer = (x, y, color) => ({
      x,
      y,
      vx: 0,
      vy: 0,
      r: 14,
      onGround: false,
      charging: false,
      jumpPower: 0,
      color,
    });

    const p1 = makePlayer(140, 420, "#fb7185");
    const p2 = makePlayer(260, 420, "#22d3ee");

    const goal = { x: () => world.w() - 80, y: () => 80, r: 24 };

    const platforms = [
      { x: 0, y: world.h() - 30, w: world.w(), h: 30 },
      { x: 120, y: world.h() - 120, w: 120, h: 18 },
      { x: 300, y: world.h() - 200, w: 120, h: 18 },
      { x: 520, y: world.h() - 280, w: 120, h: 18 },
      { x: 700, y: world.h() - 360, w: 140, h: 18 },
    ];

    /* =========================
       INPUT
    ========================= */
    const keys = new Set();

    const keyDown = (e) => {
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          " ",
          "enter",
          "arrowleft",
          "arrowright",
          "arrowup",
        ].includes(k)
      ) {
        e.preventDefault();
      }
      keys.add(k);
      if (k === " " && p1.onGround) p1.charging = true;
      if (k === "enter" && p2.onGround) p2.charging = true;
    };

    const keyUp = (e) => {
      const k = e.key.toLowerCase();
      keys.delete(k);
      if (k === " " && p1.charging) jump(p1);
      if (k === "enter" && p2.charging) jump(p2);
    };

    window.addEventListener("keydown", keyDown, { passive: false });
    window.addEventListener("keyup", keyUp);

    /* =========================
       HELPERS
    ========================= */
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const len = (x, y) => Math.hypot(x, y);

    function jump(p) {
      p.vy = -p.jumpPower;
      p.charging = false;
      p.jumpPower = 0;
      p.onGround = false;
    }

    function move(p, left, right) {
      if (keys.has(left)) p.vx -= world.accel;
      if (keys.has(right)) p.vx += world.accel;
      p.vx = clamp(p.vx, -world.maxSpeed, world.maxSpeed);
    }

    function insideGoal(p) {
      const dx = p.x - goal.x();
      const dy = p.y - goal.y();
      return Math.hypot(dx, dy) < goal.r;
    }

    /* =========================
       ROPE — MODE 2 (REAL ELASTIC)
    ========================= */
    function applyElasticRope(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, len(dx, dy));

      // 🔥 NO aplicar fuerza si están muy cerca (evita comportamientos extraños)
      if (dist < world.restLength * 0.3) return;

      const nx = dx / dist;
      const ny = dy / dist;

      const stretch = dist - world.restLength;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const relVel = rvx * nx + rvy * ny;

      let force = world.ropeK * stretch - world.ropeDamping * relVel;
      force = clamp(force, -world.maxRopeForce, world.maxRopeForce);

      // fuerza limitada + masa -> NO ARRASTRE
      a.vx += nx * force * world.massFactor;
      a.vy += ny * force * world.massFactor;
      b.vx -= nx * force * world.massFactor;
      b.vy -= ny * force * world.massFactor;
    }

    function collidePlatform(p) {
      p.onGround = false;
      for (const pl of platforms) {
        if (
          p.x + p.r > pl.x &&
          p.x - p.r < pl.x + pl.w &&
          p.y + p.r > pl.y &&
          p.y - p.r < pl.y + pl.h
        ) {
          // Calcular overlap en cada eje
          const overlapX = Math.min(
            p.x + p.r - pl.x,
            pl.x + pl.w - (p.x - p.r)
          );
          const overlapY = Math.min(
            p.y + p.r - pl.y,
            pl.y + pl.h - (p.y - p.r)
          );

          // Resolver colisión en el eje con menor overlap
          if (overlapX < overlapY) {
            // Colisión horizontal
            if (p.x < pl.x + pl.w / 2) {
              // Desde la izquierda
              p.x = pl.x - p.r;
            } else {
              // Desde la derecha
              p.x = pl.x + pl.w + p.r;
            }
            p.vx *= -0.3; // Rebote con pérdida de energía
          } else {
            // Colisión vertical
            if (p.y < pl.y + pl.h / 2) {
              // Desde arriba (aterrizando)
              p.y = pl.y - p.r;
              p.vy = 0;
              p.onGround = true;
              p.vx *= world.groundFriction;
            } else {
              // Desde abajo (golpeando la plataforma por debajo)
              p.y = pl.y + pl.h + p.r;
              p.vy *= -0.3; // Rebote hacia abajo
            }
          }
        }
      }
    }

    function keepInBounds(p) {
      const padding = 10;
      const W = world.w();
      const H = world.h();

      // Izquierda
      if (p.x - p.r < padding) {
        p.x = padding + p.r;
        p.vx *= -0.3;
      }
      // Derecha
      if (p.x + p.r > W - padding) {
        p.x = W - padding - p.r;
        p.vx *= -0.3;
      }
      // Arriba (colisión desde arriba)
      if (p.y - p.r < padding) {
        p.y = padding + p.r;
        p.vy *= -0.3;
      }
      // Abajo (colisión desde abajo - como techo)
      if (p.y + p.r > H - padding) {
        p.y = H - padding - p.r;
        p.vy *= -0.3;
        // Nota: en este caso no ponemos onGround=true porque es el borde inferior
      }
    }

    /* =========================
       LOOP
    ========================= */
    function step() {
      move(p1, "a", "d");
      move(p2, "arrowleft", "arrowright");

      if (p1.charging)
        p1.jumpPower = Math.min(
          p1.jumpPower + world.jumpChargeRate,
          world.maxJumpPower
        );
      if (p2.charging)
        p2.jumpPower = Math.min(
          p2.jumpPower + world.jumpChargeRate,
          world.maxJumpPower
        );

      p1.vy += world.gravity;
      p2.vy += world.gravity;

      applyElasticRope(p1, p2);

      [p1, p2].forEach((p) => {
        p.vx *= world.airFriction;
        p.vy *= world.airFriction;
        p.x += p.vx;
        p.y += p.vy;
        collidePlatform(p);
        keepInBounds(p);
      });

      if (!gameWon && insideGoal(p1) && insideGoal(p2)) {
        setGameWon(true);
        onGameUpdate?.({ ...(gameData || {}), ropeGameWon: true });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, world.w(), world.h());
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, world.w(), world.h());

      // platforms
      ctx.fillStyle = "#374151";
      platforms.forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h));

      // rope
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // goal
      ctx.beginPath();
      ctx.arc(goal.x(), goal.y(), goal.r, 0, Math.PI * 2);
      ctx.fillStyle = gameWon ? "#22c55e" : "#fbbf24";
      ctx.fill();

      // players
      [p1, p2].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
    }

    let raf;
    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [gameWon, gameData, onGameUpdate]);

  return (
    <div className="pixel-view">
      <div className="view-title">MINIGAME — Cuerda Elástica Real</div>
      <canvas ref={canvasRef} className="driver-canvas" />
      <p>P1: WASD + ESPACIO | P2: Flechas + ENTER</p>
      <p>
        Las plataformas tienen colisión completa - ¡no puedes pasar por debajo!
      </p>
      {gameWon && <p>¡Victoria cooperativa!</p>}
    </div>
  );
}
