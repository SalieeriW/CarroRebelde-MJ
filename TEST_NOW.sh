#!/bin/bash

echo "========================================="
echo "  测试 La Puerta de Dos Llaves 游戏"
echo "========================================="
echo ""

# 检查依赖
echo "📋 步骤 1: 检查依赖..."
echo ""

if command -v node &> /dev/null; then
    echo "✓ Node.js 版本: $(node --version)"
else
    echo "✗ Node.js 未安装"
    exit 1
fi

if command -v npm &> /dev/null; then
    echo "✓ npm 版本: $(npm --version)"
else
    echo "✗ npm 未安装"
    exit 1
fi

echo ""
echo "📦 步骤 2: 安装客户端依赖..."
cd client
if npm list colyseus.js &> /dev/null; then
    echo "✓ colyseus.js 已安装"
else
    echo "→ 安装 colyseus.js..."
    npm install colyseus.js@^0.15.0
fi

echo ""
echo "🔧 步骤 3: 集成检查..."
echo ""
echo "需要手动修改以下文件:"
echo ""
echo "1. server/src/index.ts"
echo "   添加: import { TwoKeysRoom } from '../two-keys-gate/server/src/rooms/TwoKeysRoom';"
echo "   添加: gameServer.define('two_keys', TwoKeysRoom);"
echo ""
echo "2. client/src/App.jsx"
echo "   添加: import TwoKeysGate from '../two-keys-gate/client/src/components/TwoKeysGate';"
echo "   添加: case 7: return <TwoKeysGate />;"
echo "   修改: [1,2,3,4,5,6,7].map(...)"
echo ""
echo "详细步骤请查看: two-keys-gate/TEST_GUIDE.md"
echo ""
echo "========================================="
echo "  准备启动测试"
echo "========================================="
echo ""
echo "请在两个终端运行:"
echo ""
echo "终端 1: cd server && npm run dev"
echo "终端 2: cd client && npm run dev"
echo ""
echo "然后访问: http://localhost:5173/?game=7"
echo ""

