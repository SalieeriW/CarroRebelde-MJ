# 测试指南 - La Puerta de Dos Llaves

## 🧪 完整测试流程

### 前置准备

**检查环境**
```bash
# 检查 Node.js 版本 (需要 >= 16)
node --version

# 检查 npm 版本
npm --version
```

---

## 步骤 1: 集成到主项目

### 1.1 安装客户端依赖

```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/client
npm install colyseus.js@^0.15.0
```

### 1.2 修改服务端文件

**编辑**: `server/src/index.ts`

**在文件顶部添加导入**:
```typescript
import { TwoKeysRoom } from '../two-keys-gate/server/src/rooms/TwoKeysRoom';
```

**在 `gameServer.define()` 部分添加** (在健康检查之前):
```typescript
// 注册 TwoKeysRoom
gameServer.define('two_keys', TwoKeysRoom);
console.log('✓ TwoKeysRoom registered');
```

**完整示例**:
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
console.log('✓ TwoKeysRoom registered');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

### 1.3 修改客户端文件

**编辑**: `client/src/App.jsx`

**在文件顶部添加导入**:
```jsx
import TwoKeysGate from '../two-keys-gate/client/src/components/TwoKeysGate';
```

**修改 minigame 列表** (在 default case 中):
```jsx
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
```

**在 renderMinigame() 函数中添加 case 7**:
```jsx
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
      return <TwoKeysGate />  // 添加这行
    default:
      return (
        // ... default case
      )
  }
}
```

---

## 步骤 2: 启动服务

### 2.1 启动服务端

**打开终端 1**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/server
npm run dev
```

**期待输出**:
```
✓ TwoKeysRoom registered
Server running on http://localhost:3000
```

**如果出错**:
- 检查是否有其他进程占用 3000 端口: `lsof -i :3000`
- 检查 TypeScript 编译错误
- 确认导入路径正确

### 2.2 启动客户端

**打开终端 2**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/client
npm run dev
```

**期待输出**:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**如果出错**:
- 检查是否有其他进程占用 5173 端口
- 检查 npm install 是否成功
- 确认导入路径正确

---

## 步骤 3: 双人测试

### 3.1 玩家 A - 创建房间

**浏览器 1** (推荐使用 Chrome):
```
http://localhost:5173/?game=7
```

**操作步骤**:
1. 看到 "LA PUERTA DE DOS LLAVES" 标题 ✓
2. 点击 **"Crear Nueva Sala"** 按钮
3. 等待几秒，看到 **6 位邀请码** (例如: `A1B2C3`)
4. **复制邀请码**
5. 看到自己是 "JUGADOR A"
6. 状态显示 "Esperando..." (等待玩家 B)

**截图位置**: 看到邀请码显示框

### 3.2 玩家 B - 加入房间

**浏览器 2** (推荐使用隐身模式或另一个浏览器):
```
http://localhost:5173/?game=7
```

**操作步骤**:
1. 在 "Unirse a una Sala" 输入框中输入玩家 A 的邀请码
2. 点击 **"Unirse"** 按钮
3. 看到自己是 "JUGADOR B"
4. 两个浏览器都看到 "¡Ambos jugadores conectados!"

**验证点**:
- 玩家 A 的浏览器显示: "JUGADOR B: Conectado"
- 玩家 B 的浏览器显示: "JUGADOR A: Conectado"

### 3.3 开始游戏

**两个玩家都操作**:
1. 点击 **"Estoy Listo"** 按钮
2. 两人都点击后，自动进入 **Briefing** (游戏说明)
3. 看到 30 秒倒计时
4. 可以手动点击 **"Comenzar"** 或等待自动开始

**验证点**:
- 看到游戏说明
- 倒计时正常
- 点击 "Comenzar" 后进入关卡

### 3.4 关卡 1 测试

**玩家 A 看到**:
```
Tu Vista (Jugador A - Receptor de Señal)
Has recibido una señal del espacio:

🌟 → 👾 → 🧊 → 🔮

Comunica esta secuencia a tu compañero.
```

**玩家 B 看到**:
```
Tu Información (Jugador B - Traductor)
Tienes el libro de traducción de símbolos:

🌟 Estrella      → Esperanza
👾 Alienígena    → Curiosidad
🧊 Cubo de Hielo → Calma
🔮 Bola de Cristal → Misterio
💥 Explosión     → Valor
🌊 Ola           → Fluidez
```

**协作步骤**:

1. **玩家 A 通过聊天告诉 B**:
   ```
   A: "Hola! Los símbolos son: estrella, alienígena, cubo de hielo, bola de cristal"
   ```

2. **玩家 B 翻译并回复**:
   ```
   B: "Entendido! Entonces es: Esperanza, Curiosidad, Calma, Misterio"
   ```

3. **两人都选择答案** (按顺序点击):
   - 点击 "Esperanza" (显示 ① )
   - 点击 "Curiosidad" (显示 ② )
   - 点击 "Calma" (显示 ③ )
   - 点击 "Misterio" (显示 ④ )

4. **两人都点击 "Insertar Llave"**
   - 玩家 A 点击后看到: "Esperando al otro jugador..."
   - 玩家 B 也点击
   - 两人同时看到 "对齐动画" (1.5 秒)

5. **看到成功结果**:
   ```
   ¡ÉXITO!
   ¡Excelente trabajo en equipo!
   Han decodificado la señal emocional.
   La puerta del espacio se ha abierto.

   ⭐ ⭐ ⭐
   ```

6. **自动返回 Mainboard** (5 秒后)

---

## 步骤 4: 错误测试

### 4.1 测试错误答案

**重新开始游戏，故意选错**:
1. 玩家 A 和 B 都选择: `Calma, Esperanza, Curiosidad, Misterio` (顺序错误)
2. 两人都点击 "Insertar Llave"
3. 看到温和提示:
   ```
   Las llaves aún no están alineadas. Revisemos juntos la secuencia.

   💡 Recuerden: Jugador A ve los símbolos, Jugador B los traduce a emociones.
      Trabajen paso a paso, símbolo por símbolo.
   ```
4. 选项重置，可以重新选择

### 4.2 测试不同答案

**玩家 A 和 B 选择不同的答案**:
1. 玩家 A 选择: `Esperanza, Curiosidad, Calma, Misterio`
2. 玩家 B 选择: `Esperanza, Calma, Curiosidad, Misterio` (顺序不同)
3. 两人都点击 "Insertar Llave"
4. 看到提示:
   ```
   Parece que eligieron respuestas diferentes. Revisen juntos.
   ```

### 4.3 测试聊天功能

1. 玩家 A 在聊天框输入: `Hola, ¿estás listo?`
2. 按 Enter 或点击 "Enviar"
3. 玩家 B 的浏览器立即看到消息
4. 玩家 B 回复: `Sí, listo!`
5. 验证消息实时同步

### 4.4 测试退出功能

1. 点击左上角 **"← Volver"** 按钮
2. 看到确认弹窗:
   ```
   ¿Quieres salir del desafío?
   Puedes volver cuando quieras.

   [Sí, salir]  [Seguir jugando]
   ```
3. 点击 "Sí, salir" 返回 Mainboard
4. 点击 "Seguir jugando" 留在游戏中

---

## 步骤 5: 边界情况测试

### 5.1 测试断线重连

1. 玩家 A 和 B 都进入游戏
2. 玩家 A **关闭浏览器标签页**
3. 玩家 B 看到提示: "Tu compañero se ha desconectado..."
4. **2 分钟内**玩家 A 重新打开: `http://localhost:5173/?game=7`
5. 输入相同的邀请码重新加入
6. 验证状态恢复正常

### 5.2 测试房间满员

1. 玩家 A 和 B 已在房间中
2. 打开**第三个浏览器**
3. 尝试用相同邀请码加入
4. 应该看到错误: "La sala está llena..."

### 5.3 测试无效邀请码

1. 尝试加入不存在的房间
2. 输入错误码 (例如: `ZZZZZZ`)
3. 点击 "Unirse"
4. 应该看到错误提示

---

## 📊 测试清单

完成以下所有项目即为测试通过：

### 基础功能
- [ ] 服务端启动成功，看到 "TwoKeysRoom registered"
- [ ] 客户端启动成功，无 console 错误
- [ ] 主界面显示 "MINIGAME 7"
- [ ] 点击进入游戏，看到 "LA PUERTA DE DOS LLAVES"

### 房间管理
- [ ] 创建房间成功，获得 6 位邀请码
- [ ] 邀请码显示在屏幕上
- [ ] 第二个玩家可以通过邀请码加入
- [ ] 角色分配正确 (A/B)
- [ ] 两人都看到 "¡Ambos jugadores conectados!"

### 游戏流程
- [ ] 两人点击 "Estoy Listo" 后进入 Briefing
- [ ] Briefing 倒计时显示正常
- [ ] 点击 "Comenzar" 或等待后进入关卡
- [ ] 玩家 A 看到符号序列
- [ ] 玩家 B 看到映射表
- [ ] 内容完全不同（A 看不到 B 的，反之亦然）

### 协作功能
- [ ] 聊天消息实时同步
- [ ] 答案选择实时同步（显示序号）
- [ ] 两人都点击 "Insertar Llave" 后触发验证
- [ ] 答案正确时显示成功动画
- [ ] 门开启动画播放
- [ ] 显示 3 颗星

### 错误处理
- [ ] 答案错误时显示温和提示
- [ ] 提示语气友好（无"错误"/"失败"字眼）
- [ ] 显示渐进式提示（第 1/2/3 次）
- [ ] 选项可以重新选择

### 边界情况
- [ ] 可以正常退出返回 Mainboard
- [ ] 退出确认弹窗显示
- [ ] 断线后可重连（2 分钟内）
- [ ] 房间满员时拒绝第三人加入
- [ ] 无效邀请码提示错误

### 响应式设计
- [ ] 手机端显示正常 (缩小浏览器窗口测试)
- [ ] 平板端显示正常 (中等窗口)
- [ ] 桌面端显示正常 (全屏)

---

## 🐛 常见问题排查

### 问题 1: 服务端启动失败

**错误**: `Cannot find module '../two-keys-gate/...'`

**解决**:
```bash
# 检查文件是否存在
ls -la /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/server/src/rooms/TwoKeysRoom.ts

# 如果不存在，检查路径
pwd
```

### 问题 2: TypeScript 编译错误

**错误**: `Property 'xxx' does not exist on type 'yyy'`

**解决**:
```bash
# 清理并重新编译
cd server
rm -rf node_modules package-lock.json
npm install
```

### 问题 3: WebSocket 连接失败

**错误**: Console 显示 `WebSocket connection to 'ws://localhost:3000' failed`

**解决**:
1. 确认服务端正在运行
2. 检查端口: `lsof -i :3000`
3. 检查防火墙设置
4. 尝试刷新页面

### 问题 4: 样式未显示

**问题**: 界面显示但样式错乱

**解决**:
1. 打开浏览器开发者工具 (F12)
2. 检查 Console 是否有 CSS 加载错误
3. 确认 `twokeys.css` 已被导入
4. 硬刷新: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)

### 问题 5: 两人无法连接

**问题**: 玩家 B 输入邀请码后无反应

**解决**:
1. 检查邀请码是否完全一致（大小写）
2. 确认两个浏览器都连接到同一服务器
3. 检查服务端 console 是否有错误
4. 尝试重新创建房间

---

## 📸 测试截图位置

建议在以下关键点截图记录：

1. **主界面** - 显示 MINIGAME 7
2. **Lobby** - 显示邀请码
3. **等待玩家** - 两人都连接后
4. **Briefing** - 游戏说明页
5. **关卡 1** - 玩家 A 和 B 的不同视图（两张）
6. **聊天** - 消息同步
7. **答案选择** - 显示序号
8. **成功动画** - 门开启
9. **错误提示** - 温和反馈

---

## 🎬 视频测试（可选）

**录制双屏协作视频**:
1. 使用 OBS Studio 或 QuickTime
2. 分屏录制两个浏览器
3. 演示完整流程（5-10 分钟）
4. 上传到内部分享平台

---

## ✅ 测试完成后

**如果所有测试通过**:
1. 提交代码到 Git
2. 创建 Pull Request
3. 邀请团队成员 Review
4. 部署到测试环境

**如果有问题**:
1. 记录错误信息
2. 检查上面的常见问题
3. 查看 `INTEGRATION.md` 详细步骤
4. 需要帮助时提供完整错误日志

---

**测试预计时间**: 30-60 分钟
**需要人数**: 2 人（或 2 个浏览器窗口）

🎮 开始测试吧！
