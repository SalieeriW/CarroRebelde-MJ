#!/bin/bash

echo "==================================="
echo " Starting Gomoku Duel Game"
echo "==================================="
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker."
    exit 1
fi

# Start services
echo "🚀 Starting services with Docker Compose..."
docker-compose up --build

echo ""
echo "==================================="
echo " Services started!"
echo " Client A: http://localhost:6001 (Mueve primero)"
echo " Client B: http://localhost:6002 (Mueve segundo)"
echo " Server:   http://localhost:3002"
echo "==================================="
