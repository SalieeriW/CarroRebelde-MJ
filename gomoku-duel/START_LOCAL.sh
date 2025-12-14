#!/bin/bash

echo "==================================="
echo " Starting Gomoku Duel (Local Mode)"
echo "==================================="
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js."
    exit 1
fi

# Install dependencies
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Start server in background
echo "🚀 Starting server on port 3002..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
sleep 3

# Start client A
echo "🚀 Starting Client A on port 6001..."
cd client
VITE_DEFAULT_ROLE=A VITE_PORT=6001 npm run dev &
CLIENT_A_PID=$!
cd ..

# Start client B
echo "🚀 Starting Client B on port 6002..."
cd client
VITE_DEFAULT_ROLE=B VITE_PORT=6002 npm run dev -- --port 6002 &
CLIENT_B_PID=$!
cd ..

echo ""
echo "==================================="
echo " Services started!"
echo " Client A: http://localhost:6001 (Mueve primero)"
echo " Client B: http://localhost:6002 (Mueve segundo)"
echo " Server:   http://localhost:3002"
echo ""
echo " Press Ctrl+C to stop"
echo "==================================="

# Wait for Ctrl+C
trap "kill $SERVER_PID $CLIENT_A_PID $CLIENT_B_PID; exit" INT
wait
