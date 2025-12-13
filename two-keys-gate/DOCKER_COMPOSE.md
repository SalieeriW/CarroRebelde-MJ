# 🐳 Two Keys Gate - Docker Compose 测试

让**服务端 (master)** 和 **玩家 A/B (edge)** 都在 Docker Compose 中运行，类似 `K8s-Edge-demo` 的 cloud/edge 关系。

## 快速启动

```bash
cd two-keys-gate
docker compose up --build
```

- 服务端 (Colyseus): `http://localhost:3001/health`
- 玩家 A UI: `http://localhost:5174/`
- 玩家 B UI: `http://localhost:5175/`

### 观察点
- 玩家 A/B 自动加入同一房间，角色由容器内的 `VITE_DEFAULT_ROLE` 固定（A / B）。
- `VITE_COLYSEUS_URL` 已指向 `ws://twokeys-server:3001`，可按需修改。
- UI 默认进入多人模式（`VITE_DEFAULT_MODE=multi`），无需再加 `?mode=multi`。

## 停止

```bash
docker compose down
```

> 如需重建镜像：`docker compose build --no-cache`
