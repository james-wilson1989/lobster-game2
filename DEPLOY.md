# 🦞 龙虾大亨 - 部署指南

## 架构概览

```
┌─────────────────┐     ┌──────────────────┐
│   前端 (Vercel) │────▶│  后端 (VPS/Railway)│
│   免费CDN加速   │     │  Node.js + Socket.io│
└─────────────────┘     └──────────────────┘
```

## 部署步骤

### 1. 部署后端 (Railway/Render/Fly.io)

**推荐：Railway（免费额度足够个人使用）**

```bash
# 方式一：上传到 Railway
1. 登录 railway.app
2. New Project → Deploy from GitHub
3. 选择 lobster-game2 仓库
4. 根目录填写: server
5. 环境变量添加:
   - PORT: 3001
6. 部署完成后获得后端 URL，例如: https://lobster-game-server.railway.app

# 方式二：本地部署到 VPS
cd server
npm install
npm start
```

### 2. 部署前端 (Vercel)

```bash
# 方式一：使用 Vercel CLI
npm i -g vercel
vercel

# 方式二：上传到 GitHub，在 Vercel 官网导入
# 1. 登录 vercel.com
# 2. Import Project → 选择 GitHub 仓库
# 3. 配置:
#    - Framework Preset: Vite
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. 环境变量添加:
#    - VITE_API_BASE: https://你的后端URL
```

### 3. 更新前端配置

部署完成后，修改 `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://你的后端服务器地址/:path*"
    }
  ]
}
```

## 常用命令

```bash
# 前端开发
npm run dev          # 启动前端开发服务器

# 后端开发
npm run server       # 启动后端服务器
npm run server:dev   # 后端热重载模式

# 构建
npm run build        # 构建前端生产版本
```

## 免费/低费用托管推荐

| 服务 | 类型 | 免费额度 |
|------|------|----------|
| Vercel | 前端 | 100GB/月 |
| Railway | 后端 | $5/月 免费 |
| Render | 后端 | 750小时/月 |
| Fly.io | 后端 | 3个实例 |

## 环境变量说明

前端 (.env):
```
VITE_API_BASE=http://localhost:3001  # 开发环境
VITE_API_BASE=https://your-backend.railway.app  # 生产环境
```

## WebSocket 说明

服务器已内置 Socket.io 支持，客户端可通过以下方式连接:

```javascript
import { io } from 'socket.io-client'

const socket = io('https://your-backend-server.com')

// 监听数据更新
socket.on('dataUpdated', (data) => {
  console.log('排行榜数据更新:', data)
})
```
