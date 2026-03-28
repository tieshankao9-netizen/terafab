# TERAFAB · Vercel MVP

这个版本已经改造成适合部署到 Vercel 的结构：

- 前端：`Vite + React`
- API：`Vercel Functions`
- 数据库：外部 `Postgres`
- 点赞/光荣榜：走 `/api/*`
- 实时：改为前端轮询
- 捐款验证：提交时立即尝试验证，另配 `Cron` 做补偿确认

## 当前目录重点

```bash
api/                 # Vercel Functions
lib/                 # 共享服务层（Postgres / auth / helpers）
src/                 # 前端
vercel.json          # Vercel 配置
```

## 已完成的 Vercel 改造

- 去掉对常驻 Express 进程的依赖
- 去掉对 SQLite 本地文件的依赖
- 去掉对 Socket.io 长连接的依赖
- 保留现有前端 UI 和主要交互
- 保留 `/admin` 后台入口

## 核心文件

- 前端轮询兼容层：`/src/hooks/useSocket.ts`
- 前端 API 封装：`/src/utils/api.ts`
- 后台 API 封装：`/src/utils/adminApi.ts`
- Vercel 数据层：`/lib/db.ts`
- 仓储层：`/lib/repository.ts`
- 公开配置接口：`/api/config/public.ts`
- 点赞接口：`/api/likes/index.ts`
- 捐款接口：`/api/donations/pending.ts`
- 后台接口：`/api/admin/config.ts`
- Vercel 配置：`/vercel.json`

## 环境变量

把 `/.env.vercel.example` 里的值配置到 Vercel Project Settings → Environment Variables：

```bash
VITE_API_URL=
VITE_WALLETCONNECT_PROJECT_ID=
DATABASE_URL=...
ADMIN_PASSWORD=...
WALLET_ADDRESS=...
BSCSCAN_API_KEY=...
USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955
LIKES_TO_LAUNCH=10000
CRON_SECRET=...
FINGERPRINT_SALT=...
```

说明：

- `VITE_API_URL` 在 Vercel 上通常留空，走同源 `/api`
- `DATABASE_URL` 必填，建议用 Neon / Supabase Postgres
- `CRON_SECRET` 用来保护 `/api/cron/verify-donations`

## 本地检查

安装依赖：

```bash
npm install
```

检查前端构建：

```bash
npm run build
```

检查 Vercel API 类型：

```bash
npm run typecheck:api
```

## Vercel 部署步骤

### 1. 初始化 Git 仓库并推送到 GitHub

```bash
git init
git add .
git commit -m "Prepare Vercel MVP"
```

### 2. 在 Vercel 导入 GitHub 仓库

- Framework 选择 `Vite`
- Build Command：`npm run build`
- Output Directory：`dist`

### 3. 配置环境变量

在 Vercel 后台填入 `/.env.vercel.example` 中的所有后端变量。

### 4. 绑定数据库

推荐：

- Neon
- Supabase Postgres

### 5. 首次部署后验证

检查这些地址：

- `/`
- `/admin`
- `/api/health`
- `/api/config/public`

## 与旧版的区别

旧版保留在 `/server`，主要用于本地自托管：

- `/server/src/index.ts`
- `/server/src/db/database.ts`
- `/server/src/socket.ts`

Vercel 实际不会使用这套本地常驻服务。

## 当前限制

- 不再使用 Socket.io 推送，改为轮询
- 捐款交易若提交瞬间还未被 BscScan 收录，会先停留在 `pending`
- 之后由定时任务继续补确认

## 建议的下一步

如果你要正式上线，建议继续做这两件事：

1. 把后台登录从“单一环境变量密码”升级成真正的账号密码系统
2. 把三语言切换（英 / 中 / 法）接进去
