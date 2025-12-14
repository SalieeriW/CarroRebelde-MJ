import { useEffect, useRef, useState } from "react";
import "../../styles/game.css";

/**
 * RopeCoopGame - Online 2 devices
 * - Each device controls only 1 player
 * - Host simulates physics and broadcasts state via onGameUpdate
 * - Clients send input via onPlayerAction
 *
 * Controls (both players use same keys scheme on their own device):
 * - Left/Right: A/D or ArrowLeft/ArrowRight (we accept both)
 * - Jump: Space or Enter (hold to charge, release to jump)
 */

export default function RopeCoopGame({
  gameData,
  onGameUpdate,
  onPlayerAction,
  mySessionId,
  players,
  myRole,
}) {
  const canvasRef = useRef(null);
  const [gameWon, setGameWon] = useState(false);

  // Local input state (what THIS device is pressing)
  const inputRef = useRef({
    left: false,
    right: false,
    charging: false,
    jumpReleased: false, // edge event
  });

  // CRITICAL FIX: Ref to hold the latest gameData prop
  const gameDataRef = useRef(gameData);

  // Decide local player slot (p1 or p2) based on join order
  const isHost = myRole === "player1"; //

  // Throttle sending input (avoid spamming)
  const lastSendRef = useRef(0);
  const sendMyInput = () => {
    // Si no somos p1 o p2 (rol asignado), no enviamos nada
    if (myRole !== "player1" && myRole !== "player2") return;

    const now = performance.now();
    if (now - lastSendRef.current < 40) return; // ~25fps
    lastSendRef.current = now;

    onPlayerAction?.({
      type: "minigame4_input",
      sessionId: mySessionId,
      payload: {
        left: inputRef.current.left,
        right: inputRef.current.right,
        charging: inputRef.current.charging,
        jumpReleased: inputRef.current.jumpReleased,
      },
    });

    // consume edge
    inputRef.current.jumpReleased = false;
  };

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
      gravity: 0.65,
      airFriction: 0.92,
      groundFriction: 0.8,
      accel: 0.8,
      maxSpeed: 7,
      jumpChargeRate: 1.5,
      maxJumpPower: 20,

      // Physics parameters
      restLength: 120,
      ropeK: 0.1,
      ropeDamping: 0.2,
      maxRopeForce: 1.8,
      massFactor: 0.5,
    };

    /* =========================
       ENTITIES (host simulates)
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

    // Host local simulation state
    const sim = {
      p1: makePlayer(140, 420, "#fb7185"),
      p2: makePlayer(260, 420, "#22d3ee"),
      goal: { x: () => world.w() - 80, y: () => 80, r: 24 },
      platforms: [
        { x: 0, y: () => world.h() - 30, w: () => world.w(), h: 30 },
        { x: 120, y: () => world.h() - 120, w: 120, h: 18 },
        { x: 300, y: () => world.h() - 200, w: 120, h: 18 },
        { x: 520, y: () => world.h() - 280, w: 120, h: 18 },
        { x: 700, y: () => world.h() - 360, w: 140, h: 18 },
      ],
    };

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

    function move(p, input) {
      if (input?.left) p.vx -= world.accel;
      if (input?.right) p.vx += world.accel;
      p.vx = clamp(p.vx, -world.maxSpeed, world.maxSpeed);
    }

    function insideGoal(p) {
      const dx = p.x - sim.goal.x();
      const dy = p.y - sim.goal.y();
      return Math.hypot(dx, dy) < sim.goal.r;
    }

    function applyElasticRope(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, len(dx, dy));

      if (dist < world.restLength * 0.3) return;

      const nx = dx / dist;
      const ny = dy / dist;

      const stretch = dist - world.restLength;

      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.y;
      const relVel = rvx * nx + rvy * ny;

      // Fuerza de Hooke (restauración) - Amortiguación (disipación)
      let force = world.ropeK * stretch - world.ropeDamping * relVel;
      force = clamp(force, -world.maxRopeForce, world.maxRopeForce);

      a.vx += nx * force * world.massFactor;
      a.vy += ny * force * world.massFactor;
      b.vx -= nx * force * world.massFactor;
      b.vy -= ny * force * world.massFactor;
    }

    function collidePlatform(p) {
      p.onGround = false;

      for (const pl of sim.platforms) {
        const plX = pl.x;
        const plY = typeof pl.y === "function" ? pl.y() : pl.y;
        const plW = typeof pl.w === "function" ? pl.w() : pl.w;
        const plH = pl.h;

        if (
          p.x + p.r > plX &&
          p.x - p.r < plX + plW &&
          p.y + p.r > plY &&
          p.y - p.r < plY + plH
        ) {
          const overlapX = Math.min(p.x + p.r - plX, plX + plW - (p.x - p.r));
          const overlapY = Math.min(p.y + p.r - plY, plY + plH - (p.y - p.r));

          if (overlapX < overlapY) {
            if (p.x < plX + plW / 2) p.x = plX - p.r;
            else p.x = plX + plW + p.r;
            p.vx *= -0.3;
          } else {
            if (p.y < plY + plH / 2) {
              p.y = plY - p.r;
              p.vy = 0;
              p.onGround = true;
              p.vx *= world.groundFriction;
            } else {
              p.y = plY + plH + p.r;
              p.vy *= -0.3;
            }
          }
        }
      }
    }

    function keepInBounds(p) {
      const padding = 10;
      const W = world.w();
      const H = world.h();

      if (p.x - p.r < padding) {
        p.x = padding + p.r;
        p.vx *= -0.3;
      }
      if (p.x + p.r > W - padding) {
        p.x = W - padding - p.r;
        p.vx *= -0.3;
      }
      if (p.y - p.r < padding) {
        p.y = padding + p.r;
        p.vy *= -0.3;
      }
      if (p.y + p.r > H - padding) {
        p.y = H - padding - p.r;
        p.vy *= -0.3;
      }
    }

    /* =========================
       INPUT (LOCAL DEVICE)
    ========================= */
    const keyDown = (e) => {
      const k = e.key.toLowerCase();
      if (
        [
          "a",
          "d",
          "arrowleft",
          "arrowright",
          " ",
          "enter",
          "arrowup",
          "w",
        ].includes(k)
      ) {
        e.preventDefault();
      }

      // Accept both schemes so it's easier
      if (k === "a" || k === "arrowleft") inputRef.current.left = true;
      if (k === "d" || k === "arrowright") inputRef.current.right = true;

      // Jump charge keys
      if (k === " " || k === "enter") inputRef.current.charging = true;

      sendMyInput();
    };

    const keyUp = (e) => {
      const k = e.key.toLowerCase();

      if (k === "a" || k === "arrowleft") inputRef.current.left = false;
      if (k === "d" || k === "arrowright") inputRef.current.right = false;

      if (k === " " || k === "enter") {
        inputRef.current.charging = false;
        inputRef.current.jumpReleased = true; // edge
      }

      sendMyInput();
    };

    window.addEventListener("keydown", keyDown, { passive: false });
    window.addEventListener("keyup", keyUp);

    /* =========================
       NETWORK STATE (authoritative)
    ========================= */

    // CRITICAL FIX: Update the ref with the latest prop value
    gameDataRef.current = gameData;

    const getRemoteInput = (sessionId) => {
      // FIX: Use the ref for the latest network state
      return gameDataRef.current?.m4?.inputs?.[sessionId] || null;
    };

    const getSessionIdsByRole = () => {
      const p1 = (players || []).find((p) => p.role === "player1")?.sessionId;
      const p2 = (players || []).find((p) => p.role === "player2")?.sessionId;
      return [p1, p2];
    };

    // Obtenemos los SIDs al inicio del efecto para determinar el slot local
    const [sid1, sid2] = getSessionIdsByRole();
    const mySlot =
      sid1 === mySessionId ? "p1" : sid2 === mySessionId ? "p2" : null;

    /* =========================
       HOST SIMULATION LOOP
    ========================= */
    function hostStep() {
      // Re-obtener los SIDs si es necesario, pero para el mapeo de entrada con players es mejor
      // usar el `sid1` y `sid2` calculados si `players` se actualiza.
      const [currentSid1, currentSid2] = getSessionIdsByRole();

      // Input 1: Usa input local si eres sid1, si no, usa el remoto. Si sid1 es nulo, usa vacío.
      const inp1 =
        (currentSid1 === mySessionId ? inputRef.current : null) ||
        (currentSid1 ? getRemoteInput(currentSid1) : null) ||
        {};

      // Input 2: Usa input local si eres sid2, si no, usa el remoto. Si sid2 es nulo, usa vacío.
      const inp2 =
        (currentSid2 === mySessionId ? inputRef.current : null) ||
        (currentSid2 ? getRemoteInput(currentSid2) : null) ||
        {};

      // Apply horizontal movement from inputs
      move(sim.p1, inp1);
      move(sim.p2, inp2);

      // Charge jump
      if (inp1?.charging && sim.p1.onGround) sim.p1.charging = true;
      if (inp2?.charging && sim.p2.onGround) sim.p2.charging = true;

      if (sim.p1.charging)
        sim.p1.jumpPower = Math.min(
          sim.p1.jumpPower + world.jumpChargeRate,
          world.maxJumpPower
        );
      if (sim.p2.charging)
        sim.p2.jumpPower = Math.min(
          sim.p2.jumpPower + world.jumpChargeRate,
          world.maxJumpPower
        );

      // Release jump edge
      if (inp1?.jumpReleased && sim.p1.charging) jump(sim.p1);
      if (inp2?.jumpReleased && sim.p2.charging) jump(sim.p2);

      // Gravity
      sim.p1.vy += world.gravity;
      sim.p2.vy += world.gravity;

      // Rope
      applyElasticRope(sim.p1, sim.p2);

      // Integrate + collisions
      [sim.p1, sim.p2].forEach((p) => {
        p.vx *= world.airFriction;
        p.vy *= world.airFriction;
        p.x += p.vx;
        p.y += p.vy;
        collidePlatform(p);
        keepInBounds(p);
        // if in air, stop charging automatically
        if (!p.onGround && p.charging) p.charging = false;
      });

      const won = insideGoal(sim.p1) && insideGoal(sim.p2);
      if (won && !gameWon) {
        setGameWon(true);
      }

      // Broadcast authoritative state
      onGameUpdate?.({
        ...(gameDataRef.current || {}), // Use the ref when building the next state
        m4: {
          ...(gameDataRef.current?.m4 || {}), // Use the ref when building the next state
          state: {
            // Enviamos un clon de los objetos para evitar mutaciones inesperadas
            p1: { ...sim.p1 },
            p2: { ...sim.p2 },
            won,
          },
        },
      });
    }

    /* =========================
       DRAW (EVERY CLIENT)
    ========================= */
    function drawFromState() {
      // FIX: Use the ref for the latest network state
      const st = gameDataRef.current?.m4?.state;

      // Si host, dibujar desde la simulación local; si cliente, dibujar desde el estado remoto
      const p1 = isHost ? sim.p1 : st?.p1 || sim.p1;
      const p2 = isHost ? sim.p2 : st?.p2 || sim.p2;
      const won = Boolean(isHost ? gameWon : st?.won);

      ctx.clearRect(0, 0, world.w(), world.h());
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, world.w(), world.h());

      // platforms
      ctx.fillStyle = "#374151";
      sim.platforms.forEach((p) => {
        const y = typeof p.y === "function" ? p.y() : p.y;
        const w = typeof p.w === "function" ? p.w() : p.w;
        ctx.fillRect(p.x, y, w, p.h);
      });

      // rope
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // goal
      ctx.beginPath();
      ctx.arc(sim.goal.x(), sim.goal.y(), sim.goal.r, 0, Math.PI * 2);
      ctx.fillStyle = won ? "#22c55e" : "#fbbf24";
      ctx.fill();

      // players
      [p1, p2].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Indicador visual para el jugador controlado localmente
        const pSlot = p === p1 ? "p1" : "p2";
        if (pSlot === mySlot) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      });

      // HUD
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "12px monospace";
      ctx.fillText(isHost ? "HOST (simulating)" : "CLIENT", 12, 18);
      ctx.fillText(`Controlling: ${mySlot || "Waiting..."}`, 12, 34);
    }

    let raf;
    let lastHostTick = 0;

    const loop = (t) => {
      // Host sim at fixed-ish rate
      if (isHost) {
        if (t - lastHostTick > 16) {
          lastHostTick = t;
          hostStep();
        }
      } else {
        // Non-host: keep sending input periodically while keys held
        if (
          inputRef.current.left ||
          inputRef.current.right ||
          inputRef.current.charging ||
          inputRef.current.jumpReleased
        ) {
          sendMyInput();
        }
      }

      drawFromState();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onGameUpdate,
    onPlayerAction,
    mySessionId,
    players,
    myRole,
    gameWon,
    // gameData removed from dependencies. Access via gameDataRef.current
  ]);

  return (
    <div className="pixel-view">
      <div className="view-title">MINIGAME 4 — Rope Coop (Online)</div>
      <canvas ref={canvasRef} className="driver-canvas" />
      <p>
        Tu dispositivo controla 1 jugador. Teclas: A/D o ←/→, salto: Space/Enter
      </p>
      {gameData?.m4?.state?.won && <p>¡Victoria cooperativa!</p>}
    </div>
  );
}
