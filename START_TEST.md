# 🎮 立即开始测试

## ✅ 已完成的集成步骤

1. ✓ colyseus.js 已安装
2. ✓ server/src/index.ts 已修改（导入 TwoKeysRoom）
3. ✓ client/src/App.jsx 已修改（添加 TwoKeysGate）

---

## 🚀 启动步骤（3 分钟）

### 步骤 1: 启动服务端

**打开终端 1**，运行：
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/server
npm run dev
```

**期待输出**：
```
✓ TwoKeysRoom registered
Server running on http://localhost:3000
```

如果看到这个输出 = 成功！✅

---

### 步骤 2: 启动客户端

**打开终端 2**，运行：
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/client
npm run dev
```

**期待输出**：
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

如果看到这个输出 = 成功！✅

---

### 步骤 3: 打开游戏

**浏览器 1** (Chrome 推荐)，访问：
```
http://localhost:5173/?game=7
```

**应该看到**：
```
LA PUERTA DE DOS LLAVES
Juego Cooperativo de Dos Jugadores

[Crear Nueva Sala]

Unirse a una Sala
[_______] [Unirse]
```

如果看到这个界面 = 成功！✅

---

## 🎯 快速测试（5 分钟）

### 测试 1: 创建房间

1. 点击 **"Crear Nueva Sala"**
2. 等待 2-3 秒
3. **应该看到 6 位邀请码**（例如：`A1B2C3`）

**复制这个邀请码！**

---

### 测试 2: 加入房间（需要第二个浏览器）

**打开浏览器 2**（隐身模式或另一个浏览器）：
```
http://localhost:5173/?game=7
```

1. 在输入框输入刚才的邀请码
2. 点击 **"Unirse"**
3. **两个浏览器都应该显示**：
   ```
   JUGADOR A: Conectado
   JUGADOR B: Conectado
   ```

---

### 测试 3: 开始游戏

**在两个浏览器中**：
1. 都点击 **"Estoy Listo"**
2. 看到 **Briefing** 页面（游戏说明）
3. 等待 30 秒或点击 **"Comenzar"**
4. 进入 **关卡 1**

---

### 测试 4: 协作解谜

**玩家 A 看到**：
```
🌟 → 👾 → 🧊 → 🔮
```

**玩家 B 看到**：
```
🌟 = Esperanza
👾 = Curiosidad
🧊 = Calma
🔮 = Misterio
```

**通过聊天沟通**：
```
A: "Hola, tengo: estrella, alien, hielo, bola"
B: "OK! Eso es: Esperanza, Curiosidad, Calma, Misterio"
```

**两人都按顺序选择**：
1. Esperanza (①)
2. Curiosidad (②)
3. Calma (③)
4. Misterio (④)

**两人都点击 "Insertar Llave"**

---

### 测试 5: 看到成功

**应该看到**：
```
¡ÉXITO!
¡Excelente trabajo en equipo!
⭐ ⭐ ⭐
```

门打开动画播放，5 秒后返回主界面。

---

## ✅ 测试完成标志

如果你能完成以上所有步骤，说明游戏集成成功！🎉

---

## 🐛 如果遇到问题

### 问题 1: 服务端启动失败

**错误**: `Cannot find module`

**解决**:
```bash
cd server
npm install
npm run dev
```

---

### 问题 2: 客户端启动失败

**错误**: `[vite] error`

**解决**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### 问题 3: 看不到 MINIGAME 7

**检查**:
1. 刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）
2. 检查浏览器 Console 是否有错误（F12）
3. 确认文件修改已保存

---

### 问题 4: WebSocket 连接失败

**错误**: `WebSocket connection failed`

**解决**:
1. 确认服务端正在运行
2. 检查端口占用: `lsof -i :3000`
3. 重启服务端

---

## 📊 测试检查清单

- [ ] 服务端启动成功，看到 "TwoKeysRoom registered"
- [ ] 客户端启动成功，看到 Vite 输出
- [ ] 主界面显示 "MINIGAME 7 - La Puerta de Dos Llaves"
- [ ] 可以创建房间并获得邀请码
- [ ] 第二个玩家可以加入
- [ ] 两人都能看到 "Conectado"
- [ ] 点击 "Estoy Listo" 后进入 Briefing
- [ ] 进入关卡 1 后看到不同内容
- [ ] 聊天功能正常
- [ ] 答案正确后看到成功动画

---

## 📸 需要截图的地方

1. 主界面（显示 MINIGAME 7）
2. 邀请码显示
3. 两人连接状态
4. 关卡 1 - 玩家 A 视图
5. 关卡 1 - 玩家 B 视图
6. 成功动画

---

## 🎬 下一步

测试通过后：
1. 提交代码到 Git
2. 邀请其他人测试
3. 收集反馈
4. 查看详细文档：`two-keys-gate/TEST_GUIDE.md`

---

**预计测试时间**: 10-15 分钟
**需要人数**: 1 人 + 2 个浏览器窗口

🚀 开始测试吧！
