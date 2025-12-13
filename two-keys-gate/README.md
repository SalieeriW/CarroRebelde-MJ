# La Puerta de Dos Llaves (Two Keys Gate)

**双钥匙之门** - 协作解谜游戏子模块

---

## 🎮 快速开始（双人协作模式）

### 步骤 1: 启动服务端

**终端 1**:
```bash
cd server
npm install
npm run dev
```

期待输出：
```
✓ TwoKeysRoom registered
🎮 Two Keys Gate Server running on http://localhost:3001
```

---

### 步骤 2: 启动客户端

**终端 2**:
```bash
cd client
npm install
npm run dev
```

期待输出：
```
VITE ready in xxx ms
➜  Local:   http://localhost:5174/
```

---

### 步骤 3: 打开两个浏览器窗口

#### 🎮 玩家 A（创建房间）
1. 打开：`http://localhost:5174/`
2. 点击 **"Crear Nueva Sala"**
3. 获得 6 位邀请码（例如：`A1B2C3`）
4. 等待玩家 B 加入

#### 🎮 玩家 B（加入房间）
1. 打开隐身模式或另一个浏览器：`http://localhost:5174/`
2. 在输入框中输入玩家 A 的邀请码
3. 点击 **"Unirse"**
4. 看到 "JUGADOR B" 确认加入成功

---

## 🎯 测试内容

### 角色分工
- ✅ **玩家 A（接收者）**: 看到符号序列 🌟 → 👾 → 🧊 → 🔮
- ✅ **玩家 B（翻译者）**: 看到符号映射表（🌟→Esperanza, 👾→Curiosidad...）

### 实时协作
- ✅ 实时聊天同步（100字符限制）
- ✅ 答案选择实时同步（显示序号 ①②③④）
- ✅ 同步确认机制（10秒内双方确认）
- ✅ "Limpiar" 按钮清除选择重选

### 视觉反馈
- ✅ 等待动画：🔑 旋转
- ✅ 对齐动画：钥匙对齐（1.5秒）
- ✅ 成功动画：门打开 + 3颗星弹出（2秒）
- ✅ 错误反馈：温和抖动 + 提示信息

### 退出机制
- ✅ 像素艺术对话框（替代原生alert/confirm）
- ✅ 温和提示："¿Quieres salir? Puedes volver cuando quieras."

---

## 📖 文档

- **`MULTIPLAYER_TEST.md`** - 双人测试详细步骤
- **`INTEGRATION.md`** - 集成到主项目的方法
- **`DOCKER_COMPOSE.md`** - Docker Compose 一键跑服务端 + 玩家 A/B
- **`DISENO_PUERTA_DOS_LLAVES.md`** - 完整设计文档（根目录）

---

## 🔧 快速启动脚本

```bash
./START_MULTIPLAYER.sh
# 然后按提示在 2 个终端启动
```

---

## 📊 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 服务端 | 3001 | Colyseus WebSocket 服务器 |
| 客户端 | 5174 | Vite 开发服务器 |

---

## 🐛 常见问题

### 问题 1: CSS 样式没有加载
**解决**: 刷新浏览器，清除缓存（Cmd/Ctrl + Shift + R）

### 问题 2: 无法连接到服务器
**检查**:
1. 服务端是否在运行（端口 3001）
2. 客户端是否在运行（端口 5174）
3. 浏览器控制台是否有错误

### 问题 3: 第二个玩家无法加入
**解决**:
1. 确认邀请码完全一致（区分大小写）
2. 检查服务端 console 是否有错误
3. 重新创建房间

---

## ✅ UI/UX 改进（最新）

- ✅ CSS 变量完整定义（独立运行）
- ✅ 像素艺术对话框（替代 alert/confirm）
- ✅ 答案选择可回退（点击已选项移除后续）
- ✅ "Limpiar" 清除按钮
- ✅ 完整动画系统（等待、对齐、开门、错误）

---

**开发完成**: 2025-12-13
**最后更新**: 2025-12-13（UI/UX 优化）
**语言**: 西班牙语
**框架**: React + Colyseus + 像素艺术风格
