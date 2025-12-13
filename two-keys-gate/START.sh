#!/bin/bash

echo "========================================"
echo "  🎮 La Puerta de Dos Llaves"
echo "  独立启动脚本"
echo "========================================"
echo ""

# 检查是否在正确目录
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ 错误: 请在 two-keys-gate 目录下运行此脚本"
    exit 1
fi

echo "📦 检查依赖..."

# 检查客户端依赖
if [ ! -d "client/node_modules" ]; then
    echo "→ 安装客户端依赖..."
    cd client
    npm install
    cd ..
else
    echo "✓ 客户端依赖已安装"
fi

echo ""
echo "========================================"
echo "  ✅ 准备完成！"
echo "========================================"
echo ""
echo "🚀 启动客户端:"
echo "   cd client && npm run dev"
echo ""
echo "🌐 然后访问:"
echo "   http://localhost:5174/"
echo ""
echo "💡 提示:"
echo "   - 这是独立测试模式（单人 + 模拟）"
echo "   - 可以选择玩家 A 或 B"
echo "   - 不需要启动服务端"
echo ""
echo "========================================"

