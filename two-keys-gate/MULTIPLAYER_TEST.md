# 🌐 双人协作测试指南

**La Puerta de Dos Llaves** - 真实双人模式测试

两个玩家同时在线，通过聊天和协作解开谜题！

---

## 🚀 启动步骤（3 分钟）

### 步骤 1: 启动服务端

**打开终端 1**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/server

# 第一次需要安装依赖
npm install

# 启动服务端
npm run dev
```

**期待输出**:
```
✓ TwoKeysRoom registered
🎮 Two Keys Gate Server running on http://localhost:3001
```

如果看到这个 = 成功！✅

---

### 步骤 2: 启动客户端

**打开终端 2**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/client

# 第一次需要安装依赖
npm install

# 启动客户端
npm run dev
```

**期待输出**:
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5174/
```

---

### 步骤 3: 打开两个浏览器

#### 浏览器 1 - 玩家 A

```
http://localhost:5174/?mode=multi
```

**操作**:
1. 看到 Lobby 界面
2. 点击 **"Crear Nueva Sala"**
3. 等待 2-3 秒，获得 **6 位邀请码**（例如：`A1B2C3`）
4. **复制这个邀请码！**
5. 看到自己是 "JUGADOR A"

---

#### 浏览器 2 - 玩家 B

**打开隐身模式或另一个浏览器**:
```
http://localhost:5174/?mode=multi
```

**操作**:
1. 看到 Lobby 界面
2. 在 "Unirse a una Sala" 输入框中**粘贴邀请码**
3. 点击 **"Unirse"**
4. 看到自己是 "JUGADOR B"

---

## ✅ 验证连接

**两个浏览器都应该显示**:
```
SALA DE ESPERA

Código de Sala: A1B2C3

Jugadores:
- JUGADOR A: Conectado ✓
- JUGADOR B: Conectado ✓
```

如果看到这个 = 两人已连接！🎉

---

## 🎮 开始游戏

### 1. 两人准备

**在两个浏览器中都点击**:
```
[Estoy Listo]
```

**应该看到**:
- 按钮变为 "✓ LISTO"
- 对方的状态也变为 "✓ LISTO"
- 自动进入 **Briefing**（游戏说明）

---

### 2. 游戏说明

**两个浏览器都显示**:
```
Bienvenidos a La Puerta de Dos Llaves

[30 秒倒计时...]
或
[Comenzar] 按钮
```

等待倒计时结束或任一玩家点击 "Comenzar"

---

### 3. 关卡 1 - 真实协作

#### 玩家 A 看到:
```
Tu Vista (Jugador A - Receptor de Señal)

🌟 → 👾 → 🧊 → 🔮

[聊天框]
[答案选项: Esperanza, Curiosidad, Calma, Misterio, Valor, Fluidez]
```

#### 玩家 B 看到:
```
Tu Información (Jugador B - Traductor)

🌟 Estrella      → Esperanza
👾 Alienígena    → Curiosidad
🧊 Cubo de Hielo → Calma
🔮 Bola de Cristal → Misterio
💥 Explosión     → Valor
🌊 Ola           → Fluidez

[聊天框]
[答案选项: Esperanza, Curiosidad, Calma, Misterio, Valor, Fluidez]
```

---

### 4. 通过聊天协作

**玩家 A 在聊天框输入**:
```
"Hola! Tengo: estrella, alien, hielo, bola"
```

**玩家 B 立即看到消息并回复**:
```
"Perfecto! Eso es: Esperanza, Curiosidad, Calma, Misterio"
```

**两人都能实时看到对方的消息！** ✅

---

### 5. 选择答案

**两人都按相同顺序选择**:
1. 点击 **"Esperanza"** → 显示 ①
2. 点击 **"Curiosidad"** → 显示 ②
3. 点击 **"Calma"** → 显示 ③
4. 点击 **"Misterio"** → 显示 ④

**可以实时看到对方的选择！**

---

### 6. 同步确认

**玩家 A 点击**:
```
[Insertar Llave]
```

看到：`Esperando al otro jugador...`

**玩家 B 也点击**:
```
[Insertar Llave]
```

**两人同时看到**:
- 对齐动画（1.5 秒）
- 答案验证

---

### 7. 成功！

**如果答案正确，两人都看到**:
```
¡ÉXITO!

[门打开动画]

¡Excelente trabajo en equipo!
Han decodificado la señal emocional.
La puerta del espacio se ha abierto.

⭐ ⭐ ⭐

[Volver al Tablero]
```

5 秒后自动返回主界面

---

## 🧪 测试错误情况

### 测试 1: 答案错误

**两人都选择错误顺序**（例如：Calma, Esperanza, Curiosidad, Misterio）

**应该看到**:
```
Las llaves aún no están alineadas.
Revisemos juntos la secuencia.

💡 Recuerden: Jugador A ve los símbolos,
   Jugador B los traduce a emociones.
   Trabajen paso a paso.
```

选项重置，可以重新选择 ✅

---

### 测试 2: 答案不一致

**玩家 A 选择**: Esperanza, Curiosidad, Calma, Misterio
**玩家 B 选择**: Esperanza, Calma, Curiosidad, Misterio （顺序不同）

**两人都看到**:
```
Parece que eligieron respuestas diferentes.
Revisen juntos.
```

---

### 测试 3: 未同步确认

**玩家 A 点击 "Insertar Llave"**
**玩家 B 超过 10 秒才点击**

**两人都看到**:
```
Necesitamos sincronizarnos mejor.
¡Intentemos de nuevo!
```

---

## 📊 测试检查清单

### 房间管理
- [ ] 可以创建房间并获得邀请码
- [ ] 邀请码在屏幕上清晰显示
- [ ] 第二个玩家可以通过邀请码加入
- [ ] 两人都看到 "Conectado" 状态
- [ ] 角色正确分配（A/B）

### 实时同步
- [ ] 聊天消息实时同步
- [ ] 玩家 A 发送消息，B 立即看到
- [ ] 玩家 B 发送消息，A 立即看到
- [ ] 答案选择实时同步（可以看到对方选择的序号）
- [ ] 确认状态实时同步

### 游戏流程
- [ ] 两人都点击 "Estoy Listo" 后进入 Briefing
- [ ] Briefing 在两个浏览器同步显示
- [ ] 进入关卡后，A 和 B 看到不同内容
- [ ] 答案正确时显示成功动画
- [ ] 答案错误时显示温和提示
- [ ] 可以重试多次

### 边界情况
- [ ] 玩家离开后，对方看到提示
- [ ] 可以退出返回 Lobby
- [ ] 房间满员时拒绝第三人

---

## 🐛 常见问题

### 问题 1: 无法连接到服务器

**错误**: `WebSocket connection failed`

**解决**:
1. 确认服务端正在运行（终端 1）
2. 检查端口 3001: `lsof -i :3001`
3. 重启服务端

---

### 问题 2: 第二个玩家无法加入

**错误**: 输入邀请码后无反应

**解决**:
1. 确认邀请码完全一致（大小写敏感）
2. 检查服务端 console 是否有错误
3. 刷新页面重试
4. 重新创建房间

---

### 问题 3: 聊天消息不同步

**解决**:
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 是否有 WebSocket 错误
3. 检查网络连接
4. 刷新两个浏览器

---

## 📸 截图关键时刻

1. **邀请码显示** - 玩家 A 创建房间后
2. **两人连接** - 显示 "Conectado" 状态
3. **不同视图** - A 的符号序列 vs B 的映射表
4. **聊天同步** - 两个浏览器的聊天记录
5. **成功动画** - 门打开 + 3 颗星

---

## 🎬 快速访问链接

**玩家 A（创建房间）**:
```
http://localhost:5174/?mode=multi
```

**玩家 B（加入房间）**:
```
http://localhost:5174/?mode=multi
```

---

## 📝 端口总结

| 服务 | 端口 | 说明 |
|------|------|------|
| **服务端** | 3001 | Colyseus WebSocket 服务器 |
| **客户端** | 5174 | Vite 开发服务器 |

---

**预计测试时间**: 10-15 分钟
**需要人数**: 2 人（或 2 个浏览器窗口）
**需要终端**: 2 个

🎮 准备好了吗？启动服务端和客户端，开始真实的双人协作！
