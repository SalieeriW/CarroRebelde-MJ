# 集成指南 - La Puerta de Dos Llaves

本文档说明如何将《La Puerta de Dos Llaves》游戏集成到主项目 CarroRebelde-MJ 中。

---

## 📋 前提条件

确保主项目已安装以下依赖：

### 服务端 (server/)
```json
{
  "@colyseus/schema": "^3.0.70",
  "colyseus": "^0.16.5",
  "cors": "^2.8.5",
  "express": "^5.2.1"
}
```

### 客户端 (client/)
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "colyseus.js": "^0.15.0"  // 需要添加
}
```

---

## 🔧 步骤 1: 安装客户端依赖

在主项目的客户端添加 Colyseus 客户端库：

```bash
cd client
npm install colyseus.js@^0.15.0
```

---

## 🔧 步骤 2: 注册服务端 Room

在 `server/src/index.ts` 中注册 TwoKeysRoom：

```typescript
import express from 'express';
import cors from 'cors';
import { Server } from 'colyseus';
import { createServer } from 'http';

// 导入 TwoKeysRoom
import { TwoKeysRoom } from '../two-keys-gate/server/src/rooms/TwoKeysRoom';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
});

// 注册 TwoKeysRoom
gameServer.define('two_keys', TwoKeysRoom);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

---

## 🔧 步骤 3: 集成到客户端路由

### 方式 A: 使用现有的 minigame 路由系统

在 `client/src/App.jsx` 中添加 TwoKeysGate 作为 Minigame 7：

```jsx
import { useState, useEffect } from 'react'
import './styles/game.css'
import Minigame1 from './components/layout/Minigame1'
import Minigame2 from './components/layout/Minigame2'
import Minigame3 from './components/layout/Minigame3'
import Minigame4 from './components/layout/Minigame4'
import Minigame5 from './components/layout/Minigame5'
import Minigame6 from './components/layout/Minigame6'

// 导入 TwoKeysGate
import TwoKeysGate from '../two-keys-gate/client/src/components/TwoKeysGate'

function App() {
  const [currentMinigame, setCurrentMinigame] = useState(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const minigameId = urlParams.get('game')

    const hash = window.location.hash.slice(1)
    const gameId = minigameId || hash || null

    if (gameId && gameId >= 1 && gameId <= 7) {  // 改为 7
      setCurrentMinigame(parseInt(gameId))
    }
  }, [])

  const renderMinigame = () => {
    switch (currentMinigame) {
      case 1:
        return <Minigame1 />
      case 2:
        return <Minigame2 />
      case 3:
        return <Minigame3 />
      case 4:
        return <Minigame4 />
      case 5:
        return <Minigame5 />
      case 6:
        return <Minigame6 />
      case 7:
        return <TwoKeysGate />  // 添加 TwoKeysGate
      default:
        return (
          <div className="pixel-lobby">
            <div className="pixel-bg"></div>
            <div className="lobby-container">
              <h1 className="lobby-title">MINIGAMES</h1>
              <p className="lobby-subtitle">Select a minigame to play</p>
              <div className="lobby-section">
                <div className="rooms-list">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (  // 添加 7
                    <div
                      key={num}
                      className="room-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setCurrentMinigame(num)
                        window.history.pushState({}, '', `?game=${num}`)
                      }}
                    >
                      <span className="room-code">
                        MINIGAME {num}
                        {num === 7 && ' - La Puerta de Dos Llaves'}
                      </span>
                      <span className="room-players">→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="game-container">
      {renderMinigame()}
    </div>
  )
}

export default App
```

### 方式 B: 独立路由（可选）

如果需要独立路由，可以使用 React Router：

```bash
cd client
npm install react-router-dom
```

然后修改 `App.jsx`：

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TwoKeysGate from '../two-keys-gate/client/src/components/TwoKeysGate'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Mainboard />} />
        <Route path="/minigame/:id" element={<MinigameRouter />} />
        <Route path="/two-keys-gate" element={<TwoKeysGate />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## 🔧 步骤 4: 复制样式文件（可选）

如果想将 TwoKeysGate 的样式合并到主项目的样式中，可以：

```bash
cat two-keys-gate/client/src/styles/twokeys.css >> client/src/styles/game.css
```

或者在 TwoKeysGate.jsx 中直接导入：

```jsx
import '../styles/twokeys.css'  // 已经包含在组件中
```

---

## 🔧 步骤 5: 配置环境变量

创建 `client/.env` 文件：

```env
VITE_COLYSEUS_URL=ws://localhost:3000
```

然后在 `TwoKeysGate.jsx` 中使用：

```jsx
const serverUrl = import.meta.env.VITE_COLYSEUS_URL || 'ws://localhost:3000';

const {
  room,
  state,
  // ...
} = useColyseus(serverUrl);
```

---

## 🧪 步骤 6: 测试集成

### 1. 启动服务端

```bash
cd server
npm run dev
```

服务端应该输出：
```
Server running on http://localhost:3000
```

### 2. 启动客户端

```bash
cd client
npm run dev
```

客户端应该运行在 `http://localhost:5173`

### 3. 测试游戏

访问 `http://localhost:5173?game=7` 或点击主界面的 "MINIGAME 7"

---

## ✅ 验证清单

- [ ] 服务端成功启动，无错误
- [ ] 客户端成功启动，无错误
- [ ] 可以创建房间并获得 6 位邀请码
- [ ] 第二个玩家可以通过邀请码加入
- [ ] 两个玩家可以看到不同的内容（A 看符号，B 看映射）
- [ ] 聊天功能正常工作
- [ ] 选择答案后可以同步确认
- [ ] 答案正确时显示成功动画
- [ ] 答案错误时显示温和提示
- [ ] 可以正常返回主界面

---

## 🐛 常见问题

### 问题 1: Colyseus 连接失败

**错误**: `WebSocket connection failed`

**解决**:
- 确认服务端正在运行 (`http://localhost:3000`)
- 检查防火墙设置
- 确认 CORS 已正确配置

### 问题 2: 无法导入子模块组件

**错误**: `Module not found: Can't resolve '../two-keys-gate/...'`

**解决**:
- 确认路径正确（相对于 `client/src/App.jsx`）
- 可能需要使用绝对路径：
  ```jsx
  import TwoKeysGate from '../../two-keys-gate/client/src/components/TwoKeysGate'
  ```

### 问题 3: 样式未生效

**解决**:
- 确认 `twokeys.css` 已被正确导入
- 检查 CSS 变量是否在主项目的 `game.css` 中定义
- 可以在浏览器开发者工具中检查 CSS 是否加载

### 问题 4: TypeScript 错误

**错误**: 服务端 TypeScript 编译错误

**解决**:
- 确认 `server/tsconfig.json` 包含了子模块路径：
  ```json
  {
    "include": [
      "src/**/*",
      "../two-keys-gate/server/src/**/*"
    ]
  }
  ```

---

## 📦 生产部署

### 打包客户端

```bash
cd client
npm run build
```

生成的文件在 `client/dist/`

### 打包服务端

```bash
cd server
npm run build  # 如果有配置 build script
```

或者直接使用 `ts-node`:

```bash
npm run start
```

### 环境变量

生产环境需要设置：

```env
# 服务端
PORT=3000
NODE_ENV=production

# 客户端
VITE_COLYSEUS_URL=wss://your-server.com
```

---

## 📚 下一步

1. **添加更多关卡**: 修改 `levelData.json` 和创建 `Level2.jsx`, `Level3.jsx`
2. **主持人功能**: 创建 `ModeratorPanel.jsx` 组件
3. **多语言支持**: 集成 i18n
4. **数据分析**: 添加匿名统计（完成时间、提示使用次数）

---

## 🆘 获取帮助

如有问题，请参考：
- [Colyseus 官方文档](https://docs.colyseus.io/)
- [React 官方文档](https://react.dev/)
- 项目设计文档: `DISENO_PUERTA_DOS_LLAVES.md`

---

**集成完成！** 🎉

现在玩家可以通过主界面进入《La Puerta de Dos Llaves》并开始协作解谜了。
