# Next.js 背景移除工具

使用 Next.js + Tailwind CSS + Cloudflare Workers 构建的背景移除工具。

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
编辑 `.env.local`，设置 Worker API 地址：
```
NEXT_PUBLIC_API_URL=https://your-worker.workers.dev/remove-bg
```

3. 启动开发服务器：
```bash
npm run dev
```

访问 http://localhost:3000

## 部署

### Vercel（推荐）
```bash
npm run build
vercel deploy
```

### Cloudflare Pages
```bash
npm run build
wrangler pages deploy out
```

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Axios
