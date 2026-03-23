# 背景移除工具 - Cloudflare 版本

使用 Cloudflare Workers + Remove.bg API 的轻量级背景移除工具。

## 特点

- ⚡ 无服务器架构，全球 CDN 加速
- 💰 按需付费，无需维护服务器
- 🔒 纯内存处理，不存储任何图片
- 🌍 Cloudflare Pages 托管前端

## 部署步骤

### 1. 获取 Remove.bg API Key

访问 https://www.remove.bg/api 注册并获取 API Key（免费版每月 50 次）

### 2. 部署 Worker

```bash
cd worker
npm install -g wrangler
wrangler login
wrangler deploy
```

在 Cloudflare Dashboard 设置环境变量：
- 变量名：`REMOVE_BG_API_KEY`
- 值：你的 API Key

### 3. 部署前端

```bash
cd frontend
# 修改 index.html 中的 API_URL 为你的 Worker URL
```

**方式 A：Cloudflare Pages**
- 在 Cloudflare Dashboard 创建 Pages 项目
- 连接 Git 仓库或直接上传 frontend 文件夹

**方式 B：直接托管**
- 将 index.html 上传到任何静态托管服务

### 4. 更新 API URL

编辑 `frontend/index.html`，将：
```javascript
const API_URL = 'YOUR_WORKER_URL/remove-bg';
```
改为你的 Worker URL。

## 成本估算

**Remove.bg API：**
- 免费版：50 次/月
- 付费版：$0.20/张起

**Cloudflare：**
- Workers：免费版 100,000 次请求/天
- Pages：免费托管

## 使用限制

- 图片大小：最大 12MB
- 支持格式：JPG, PNG, WebP
- 处理时间：2-5 秒

## 本地测试

```bash
cd worker
wrangler dev
```

访问 http://localhost:8787

## 生产优化建议

1. 添加速率限制防止滥用
2. 使用 Cloudflare KV 缓存相同图片结果
3. 添加用户认证（可选）
4. 监控 API 使用量

## License

MIT
