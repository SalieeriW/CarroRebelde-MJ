#!/bin/bash

echo "========================================"
echo "  🌐 双人协作模式 - 启动脚本"
echo "========================================"
echo ""

# 检查是否在正确目录
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ 错误: 请在 two-keys-gate 目录下运行此脚本"
    exit 1
fi

echo "📦 步骤 1: 安装依赖..."
echo ""

# 安装服务端依赖
if [ ! -d "server/node_modules" ]; then
    echo "→ 安装服务端依赖..."
    cd server
    npm install
    cd ..
    echo "✓ 服务端依赖已安装"
else
    echo "✓ 服务端依赖已安装"
fi

# 安装客户端依赖
if [ ! -d "client/node_modules" ]; then
    echo "→ 安装客户端依赖..."
    cd client
    npm install
    cd ..
    echo "✓ 客户端依赖已安装"
else
    echo "✓ 客户端依赖已安装"
fi

echo ""
echo "========================================"
echo "  ✅ 依赖检查完成！"
echo "========================================"
echo ""
echo "🚀 现在需要打开 2 个终端:"
echo ""
echo "📌 终端 1 (服务端):"
echo "   cd server && npm run dev"
echo ""
echo "📌 终端 2 (客户端):"
echo "   cd client && npm run dev"
echo ""
echo "🌐 然后打开 2 个浏览器窗口:"
echo ""
echo "   玩家 A: http://localhost:5174/?mode=multi"
echo "   玩家 B: http://localhost:5174/?mode=multi"
echo ""
echo "💡 详细步骤请查看:"
echo "   MULTIPLAYER_TEST.md"
echo ""
echo "========================================"

