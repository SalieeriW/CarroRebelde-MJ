# Gomoku Duel - Setup Guide

## 🎮 Dual Client Architecture

This game uses **two separate client instances** for a better multiplayer experience:

- **Client A (Port 6001)**: First player - moves first
- **Client B (Port 6002)**: Second player - moves after A
- **Server (Port 3002)**: Game state backend

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cd gomoku-duel
./START.sh
```

**Access:**
- Player A: http://localhost:6001
- Player B: http://localhost:6002

### Option 2: Local Development

```bash
cd gomoku-duel
./START_LOCAL.sh
```

This will start:
1. Server on port 3002
2. Client A on port 6001 (auto-claims seat A)
3. Client B on port 6002 (auto-claims seat B)

---

## 📋 Game Flow

1. **Player A** opens http://localhost:6001
   - Automatically claims seat A
   - Sees: "Eres Jugador A - Mueves primero"
   - Clicks "Estoy listo"

2. **Player B** opens http://localhost:6002
   - Automatically claims seat B
   - Sees: "Eres Jugador B - Mueves segundo"
   - Clicks "Estoy listo"

3. **Either player** clicks "Comenzar (5s)"
   - 5-second countdown (Briefing screen)
   - Instructions shown

4. **Game starts**
   - Player A makes first move (black stone ●)
   - AI responds (white stone ○)
   - Player B makes second move (black stone ●)
   - AI responds again
   - Continues until victory/defeat/draw

5. **Game ends**
   - Result panel shows victory/defeat
   - Click "Reiniciar" to reset and play again

---

## 🎨 UI Design

Based on **Two Keys Gate** pixel art style:

- **Font**: Press Start 2P (Google Fonts)
- **Theme**: Dark pixel art with neon highlights
- **Colors**:
  - Yellow (`#f9d71c`): Titles, highlights
  - Green (`#00ff41`): Ready status, player stones
  - Red (`#ff0040`): Last move highlight
  - Blue (`#00d9ff`): AI turn indicator

- **Animations**:
  - `pulse`: Waiting messages, AI turn
  - `glow`: Active elements
  - `scaleIn`: Modal/result panels

---

## 🔧 Environment Variables

### Client A
```env
VITE_DEFAULT_ROLE=A
VITE_PORT=6001
VITE_API_URL=http://localhost:3002
VITE_ROOM_CODE=GOMOKU1
```

### Client B
```env
VITE_DEFAULT_ROLE=B
VITE_PORT=6002
VITE_API_URL=http://localhost:3002
VITE_ROOM_CODE=GOMOKU1
```

---

## 📝 Turn Order System

- **Jugador A**: Primer turno (first move)
- **Jugador B**: Segundo turno (second move)
- **IA**: Automático (responds after each player move)

The briefing screen clearly states:
> "3. Jugador A tiene el primer turno (mueve primero)."
> "4. Jugador B tiene el segundo turno (mueve después de A)."

---

## 🐛 Troubleshooting

### Ports already in use

```bash
# Kill existing processes
lsof -ti:6001 | xargs kill -9
lsof -ti:6002 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Auto-claim not working

Check browser console for:
- `VITE_DEFAULT_ROLE` environment variable
- WebSocket/polling connection status

### Styles not loading

Ensure these files exist:
- `client/src/styles/gomoku.css`
- `client/src/styles/gomoku-board.css`

Check `client/src/main.jsx` imports them.

---

## 🧪 Testing Checklist

- [ ] Both clients start on correct ports
- [ ] Auto-claim works (A claims A, B claims B)
- [ ] Role hint shows correctly in lobby
- [ ] Both players can mark ready
- [ ] Countdown works
- [ ] Briefing shows turn order instructions
- [ ] Board renders correctly
- [ ] Turn indicator shows correct player
- [ ] Player A moves first
- [ ] Player B moves second
- [ ] AI responds after each move
- [ ] Chat works between players
- [ ] Victory/defeat panels display
- [ ] Reset works correctly

---

## 🎯 Key Features

✅ Dual client setup (ports 6001 & 6002)
✅ Auto-claim roles (A/B)
✅ Two Keys Gate UI/UX
✅ Spanish language
✅ Turn order clearly indicated
✅ Heuristic AI opponent
✅ Real-time chat
✅ Press Start 2P font
✅ Pixel art animations

---

**Ready to play!** Open two browser windows at the respective ports. 🎮
