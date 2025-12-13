# 🧪 快速测试（无需服务端）

## ✅ 独立测试模式

不需要启动服务端，不需要两个浏览器，只需要一个浏览器即可测试游戏核心功能！

---

## 🚀 启动步骤（1 分钟）

### 步骤 1: 只启动客户端

```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/client
npm run dev
```

### 步骤 2: 打开测试页面

```
http://localhost:5173/?game=8
```

**应该看到**:
```
MODO DE PRUEBA
Selecciona tu rol para probar el juego

[Jugador A (Receptor de Señal)]
[Jugador B (Traductor)]
```

---

## 🎮 测试流程（5 分钟）

### 1. 选择角色

**选择玩家 A** 或 **玩家 B**

- **玩家 A**: 看到符号序列 🌟 → 👾 → 🧊 → 🔮
- **玩家 B**: 看到翻译映射表

💡 另一个玩家会被自动模拟！

---

### 2. 游戏说明 (Briefing)

看到游戏说明页面：
```
Bienvenidos a La Puerta de Dos Llaves
需要你们共同合作打开大门

[30 秒倒计时...]

[Comenzar] 按钮
```

可以：
- 等待 30 秒自动开始
- 或直接点击 **"Comenzar"**

---

### 3. 关卡 1 - 协作解谜

#### 如果你选择了玩家 A:

**你看到**:
```
Tu Vista (Jugador A - Receptor de Señal)
Has recibido una señal del espacio:

🌟 → 👾 → 🧊 → 🔮

Comunica esta secuencia a tu compañero.
```

**在聊天框输入**:
```
"Tengo: estrella, alien, hielo, bola de cristal"
```

**模拟的玩家 B 会自动回复**:
```
Jugador B: "Entendido! Dame un momento..."
```

#### 如果你选择了玩家 B:

**你看到**:
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

---

### 4. 选择答案

**正确答案顺序**:
1. 点击 **"Esperanza"** (显示 ①)
2. 点击 **"Curiosidad"** (显示 ②)
3. 点击 **"Calma"** (显示 ③)
4. 点击 **"Misterio"** (显示 ④)

**应该看到**:
```
Tu secuencia:
Esperanza → Curiosidad → Calma → Misterio
```

---

### 5. 插入钥匙

点击 **"Insertar Llave"** 按钮

**应该看到**:
```
Esperando al otro jugador...
```

1 秒后模拟的另一个玩家会自动确认

---

### 6. 成功！

**应该看到**:

```
¡ÉXITO!

[门开启动画]

¡Excelente trabajo en equipo!
Han decodificado la señal emocional.
La puerta del espacio se ha abierto.

⭐ ⭐ ⭐

[Volver al Tablero]
```

点击 "Volver al Tablero" 返回角色选择页面

---

## 🎯 测试重点

### ✅ 需要验证的功能

- [ ] **角色选择**: 可以选择玩家 A 或 B
- [ ] **Briefing 显示**: 看到游戏说明和倒计时
- [ ] **内容差异**: 玩家 A 和 B 看到不同内容
- [ ] **聊天功能**: 可以发送消息（模拟回复）
- [ ] **答案选择**: 可以按顺序选择答案
- [ ] **序号显示**: 选择后显示 ① ② ③ ④
- [ ] **确认机制**: 点击"插入钥匙"后等待
- [ ] **成功动画**: 门打开动画播放
- [ ] **星星显示**: 显示 3 颗星
- [ ] **返回功能**: 可以返回角色选择

---

## 🧪 错误测试

### 测试 1: 选择错误答案

选择错误的顺序（例如：Calma, Esperanza, Curiosidad, Misterio）

**应该看到**:
```
[不会看到成功，因为这是简化版本]
```

💡 **注意**: 独立测试模式会自动成功，完整的错误处理需要在完整版本（game=7）中测试

---

## 📊 对比两种测试模式

| 功能 | 独立测试 (game=8) | 完整版本 (game=7) |
|------|------------------|------------------|
| **需要服务端** | ❌ 不需要 | ✅ 需要 |
| **需要两人** | ❌ 单人 + 模拟 | ✅ 需要两个浏览器 |
| **测试速度** | ⚡ 快速（5分钟） | 🐢 较慢（15分钟） |
| **测试内容** | UI + 流程 | 完整功能 + 网络 |
| **错误处理** | ❌ 简化 | ✅ 完整 |
| **聊天同步** | ❌ 模拟 | ✅ 真实同步 |
| **适用场景** | 快速验证 UI/UX | 完整集成测试 |

---

## 💡 使用建议

### 什么时候用独立测试 (game=8)?

✅ **快速验证**:
- 检查 UI 是否正确显示
- 验证布局和样式
- 测试按钮交互
- 检查动画效果
- 演示给非技术人员

❌ **不适合**:
- 测试网络同步
- 测试错误处理
- 测试断线重连
- 完整的双人协作测试

### 什么时候用完整版本 (game=7)?

✅ **完整测试**:
- 测试真实的双人协作
- 验证网络同步
- 测试错误处理
- 测试所有边界情况
- 最终验收测试

---

## 🎬 测试视频录制

使用独立测试模式可以快速录制演示视频：

1. 打开 `http://localhost:5173/?game=8`
2. 选择角色（A 或 B）
3. 录制从 Briefing → Level1 → Success 的完整流程
4. 5 分钟内完成录制

---

## 🐛 故障排除

### 问题: 看不到 MINIGAME 8

**解决**:
```bash
# 硬刷新浏览器
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 问题: 样式错乱

**解决**:
1. 打开开发者工具 (F12)
2. 检查 Console 错误
3. 确认 twokeys.css 已加载

### 问题: 点击按钮无反应

**解决**:
1. 打开 Console (F12)
2. 查看是否有 JavaScript 错误
3. 确认文件已保存

---

## ✅ 测试完成后

如果独立测试通过，说明：
- ✅ UI 组件正常工作
- ✅ 游戏流程逻辑正确
- ✅ 动画和样式正确

下一步：
1. 测试完整版本（需要服务端）
2. 邀请其他人进行双人测试
3. 收集反馈并优化

---

**测试时间**: 5-10 分钟
**需要人数**: 1 人
**需要服务端**: ❌ 不需要

🚀 立即开始测试：`http://localhost:5173/?game=8`
