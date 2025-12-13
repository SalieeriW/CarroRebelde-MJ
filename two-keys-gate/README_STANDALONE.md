# 🎮 独立运行指南

## 作为独立子模块运行 Two Keys Gate

这个子模块可以**完全独立运行**，不需要修改主项目。

---

## 🚀 快速启动（3 步）

### 步骤 1: 安装依赖

```bash
# 在 two-keys-gate 目录下
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate

# 安装客户端依赖
cd client
npm install

# 安装服务端依赖（可选，测试模式不需要）
cd ../server
npm install
```

---

### 步骤 2: 启动客户端（单人测试模式）

```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/client
npm run dev
```

**应该看到**:
```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5174/
```

---

### 步骤 3: 打开浏览器

```
http://localhost:5174/
```

**会看到**:
```
MODO DE PRUEBA
Selecciona tu rol para probar el juego

[Jugador A (Receptor de Señal)]
[Jugador B (Traductor)]
```

---

## 🎯 测试流程

### 1. 选择角色

点击 **"Jugador A"** 或 **"Jugador B"**

- **Jugador A**: 看到符号 `🌟 → 👾 → 🧊 → 🔮`
- **Jugador B**: 看到翻译映射表

### 2. 游戏说明 (Briefing)

- 看到游戏说明
- 30 秒倒计时或点击 "Comenzar"

### 3. 关卡 1

**测试内容**:
- ✅ 聊天功能（输入消息会收到自动回复）
- ✅ 答案选择（按顺序点击 4 个选项）
- ✅ 序号显示（① ② ③ ④）
- ✅ 确认按钮（"Insertar Llave"）

**正确答案**:
1. Esperanza
2. Curiosidad
3. Calma
4. Misterio

### 4. 成功动画

- ✅ 门打开动画
- ✅ 3 颗星 ⭐⭐⭐
- ✅ 成功消息

---

## 📊 运行模式对比

| 模式 | 端口 | 服务端 | 说明 |
|------|------|--------|------|
| **独立测试** | 5174 | ❌ 不需要 | 单人 + 模拟，快速验证 UI |
| **完整双人** | 5174 | ✅ 需要 (3001) | 真实双人协作 |

---

## 🌐 完整双人模式（可选）

如果要测试真实的双人协作：

**终端 1 - 启动服务端**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/server
npm run dev
```

**终端 2 - 启动客户端**:
```bash
cd /Users/hdzhu/my_code/CarroRebelde-MJ/two-keys-gate/client
npm run dev
```

然后修改 `client/src/App.jsx` 使用 `TwoKeysGate` 而不是 `StandaloneTest`。

---

## 🔗 集成到主项目

参见: `INTEGRATION.md`

---

## ✅ 优势

- ✅ **独立**: 不修改主项目代码
- ✅ **快速**: 单人测试，无需服务端
- ✅ **简单**: 只需 `npm install` + `npm run dev`
- ✅ **完整**: 可以测试所有 UI 和流程

---

**预计时间**: 安装 2 分钟 + 测试 5 分钟 = 7 分钟

🎮 开始测试: `http://localhost:5174/`
