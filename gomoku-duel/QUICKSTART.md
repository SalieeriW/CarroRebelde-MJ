# Gomoku Duel - Quick Start Guide

## Installation & Setup

### Prerequisites
- Node.js 18+ (for local mode)
- Docker & Docker Compose (for containerized mode)

### Method 1: Local Development (Fastest)

```bash
cd gomoku-duel

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start both services
./START_LOCAL.sh
```

**Access:**
- Frontend: http://localhost:6001
- Backend API: http://localhost:3002

### Method 2: Docker Compose

```bash
cd gomoku-duel
./START.sh
```

Or manually:
```bash
docker-compose up --build
```

## Testing the Game Flow

### 1. Open Two Browser Windows

**Window 1 (Player A):**
```
http://localhost:6001
```

**Window 2 (Player B):**
```
http://localhost:6001
```

### 2. Lobby Phase

**Both players:**
1. Click "Tomar asiento" on seat A or B
2. Click "Estoy listo"

**Either player:**
3. Click "Comenzar (5s)"

### 3. Briefing Phase (5 seconds)

- Game rules displayed in Spanish
- Countdown from 5 to 1
- Auto-transitions to game board

### 4. Game Phase

**Player's turn (Black ●):**
1. Click any empty cell on the 15×15 board
2. Cell highlights in blue
3. Click "Confirmar jugada"
4. Wait for AI response

**AI's turn (White ○):**
- AI automatically plays after ~0.8s
- Last move highlighted in red
- Turn switches back to players

**Goal:**
- Create 5 consecutive stones (horizontal, vertical, or diagonal)
- Collaborate with your partner via chat

### 5. Result Phase

**Victory:**
- Green panel: "¡Victoria!"
- Click "Reiniciar" to play again

**Defeat:**
- Red panel: "Derrota"
- Click "Reiniciar" to play again

**Draw:**
- Yellow panel: "Empate"
- Board full with no winner

## API Testing

### Check Server Health

```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "gomoku-api",
  "room": "GOMOKU1"
}
```

### Get Room State

```bash
curl http://localhost:3002/rooms/GOMOKU1
```

### Make a Move (requires clientId from browser)

```bash
curl -X POST http://localhost:3002/rooms/GOMOKU1/move \
  -H "Content-Type: application/json" \
  -d '{"clientId": "your-client-id", "x": 7, "y": 7}'
```

## Common Issues

### Port Already in Use

**Error:** `Port 3002 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3002
# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Client Can't Connect

**Symptoms:** Loading spinner forever

**Solutions:**
1. Check server is running: `curl http://localhost:3002/health`
2. Clear browser localStorage
3. Check browser console for errors
4. Verify VITE_API_URL in client/.env

### AI Not Responding

**Symptoms:** Turn stuck on "Turno de la IA"

**Debug:**
1. Check server logs for errors
2. Verify board state in API: `GET /rooms/GOMOKU1`
3. Restart server

### Docker Build Fails

**Solution:**
```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

## Development Tips

### Watch Logs

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

### Hot Reload

Both server and client support hot reload in development mode.

### Test AI Logic

```bash
cd server
npm install
npm test  # (if tests are added)
```

### Modify Board Size

Edit `server/src/gomoku/board.ts`:
```typescript
export const BOARD_SIZE = 13;  // Change from 15 to 13
```

### Change AI Difficulty

Edit `server/src/gomoku/ai.ts`:
```typescript
// Increase defense weight for harder AI
score += scorePattern(line) * 2.0;  // was 1.5
```

## Next Steps

1. ✅ Game is playable with basic heuristic AI
2. 🔄 Extend AI with Minimax algorithm
3. 🔄 Add move history visualization
4. 🔄 Implement undo/redo functionality
5. 🔄 Add difficulty levels
6. 🔄 Track game statistics

## Architecture Overview

```
Client (React)          Server (Express)
     |                       |
     |-- HTTP Polling -->    |
     |   (every 1s)          |
     |                       |
     |<-- Room State -----   |
     |                       |
     |-- POST /move -->      |
     |   (x, y)              |
     |                       |
     |                   AI Engine
     |                   evaluates
     |                   responds
     |                       |
     |<-- Updated State --   |
```

## File Structure Reference

```
gomoku-duel/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby.jsx          # Seat selection
│   │   │   ├── Briefing.jsx       # Game rules
│   │   │   ├── GomokuBoard.jsx    # 15×15 board
│   │   │   ├── GomokuGame.jsx     # Main game view
│   │   │   └── TeamChat.jsx       # Player chat
│   │   ├── hooks/
│   │   │   └── useMultiplayerGame.js
│   │   ├── App.jsx                # Root component
│   │   └── App.css                # Pixel art styles
│   └── package.json
├── server/
│   ├── src/
│   │   ├── gomoku/
│   │   │   ├── ai.ts              # Heuristic AI
│   │   │   ├── board.ts           # Board logic
│   │   │   └── rules.ts           # Win detection
│   │   ├── index.ts               # REST API
│   │   └── types.ts               # TypeScript types
│   └── package.json
├── shared/
│   └── gameData.json              # Spanish text
├── docker-compose.yml
├── START.sh                       # Docker startup
└── START_LOCAL.sh                 # Local startup
```

---

**Happy Gaming! 🎮**
