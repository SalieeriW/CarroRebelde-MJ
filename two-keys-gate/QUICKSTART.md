# 快速开始指南

5 分钟启动《La Puerta de Dos Llaves》游戏！

## 🚀 快速集成（3 步）

### 步骤 1: 安装依赖

```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/client
npm install colyseus.js@^0.15.0
```

### 步骤 2: 注册 Room

编辑 `server/src/index.ts`，在最后添加：

```typescript
import { TwoKeysRoom } from '../two-keys-gate/server/src/rooms/TwoKeysRoom';
gameServer.define('two_keys', TwoKeysRoom);
```

### 步骤 3: 添加路由

编辑 `client/src/App.jsx`，添加导入：

```jsx
import TwoKeysGate from '../two-keys-gate/client/src/components/TwoKeysGate';
```

在 `renderMinigame()` 函数中添加：

```jsx
case 7:
  return <TwoKeysGate />;
```

在主界面的 minigames 数组改为 `[1, 2, 3, 4, 5, 6, 7]`

## 🧪 测试

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev

# 浏览器访问: http://localhost:5173?game=7
```

## ✅ 验证

1. 看到 "LA PUERTA DE DOS LLAVES" 标题 ✓
2. 点击 "Crear Nueva Sala" 获得 6 位码 ✓
3. 新窗口输入码加入房间 ✓
4. 两人都点 "Estoy Listo" ✓
5. 进入 Briefing → 关卡 1 ✓

完成！🎉

详细文档: `INTEGRATION.md`
