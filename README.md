# ImageMatte - AI 图片背景去除工具

一键去除图片背景，3 秒完成人像抠图，无需 PS 技能。

## 功能特性

- 🚀 **快速处理**: 3-5 秒完成背景去除
- 🎨 **高质量**: 支持 4K 高清图片
- 📱 **简单易用**: 拖拽上传，一键下载
- 🔒 **隐私安全**: 纯内存处理，不存储图片
- 💰 **低成本**: 基于 Replicate API，按需付费

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **AI**: Remove.bg API
- **部署**: Cloudflare Pages

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ylx911229/image-background-remover.git
cd image-background-remover
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 Remove.bg API Key:

```env
REMOVEBG_API_KEY=your_removebg_api_key_here
```

> 获取 API Key: https://www.remove.bg/api
> 免费账户: 50 次/月

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 查看效果。

## 部署到 Cloudflare Pages

### 1. 连接 GitHub 仓库

登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Pages，连接此仓库。

### 2. 配置构建设置

- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`

### 3. 设置环境变量

在 Cloudflare Pages 设置中添加:

```
REMOVEBG_API_KEY=your_removebg_api_key_here
```

### 4. 部署

点击 "Save and Deploy"，等待部署完成。

## 使用说明

1. 访问网站
2. 拖拽或点击上传图片（支持 JPG、PNG、WEBP）
3. 等待 3-5 秒 AI 处理
4. 查看对比效果
5. 下载处理后的 PNG 图片

## 成本估算

### Remove.bg 定价
- **免费版**: 50 次/月
- **订阅版**: $9/月（500 次）或 $99/月（5000 次）
- **按需付费**: $0.20/张（高清）

### 预估成本
- **开发阶段**: 免费（50 次/月）
- **100 用户/天**: ~$600/月（3000 次）
- **1000 用户/天**: 需要企业方案

## 项目结构

```
image-background-remover/
├── app/
│   ├── api/
│   │   └── remove-bg/
│   │       └── route.ts          # API 路由
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 主页面
│   └── globals.css               # 全局样式
├── components/
│   ├── ImageUploader.tsx         # 上传组件
│   └── ImageComparison.tsx       # 对比展示组件
├── public/                       # 静态资源
├── .env.example                  # 环境变量示例
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
└── package.json                  # 依赖配置
```

## 开发计划

- [x] 基础上传功能
- [x] AI 背景去除
- [x] 结果预览和下载
- [ ] 批量处理
- [ ] 自定义背景色
- [ ] 付费计划

## License

MIT

## 作者

姚路行 - [@ylx911229](https://github.com/ylx911229)

---

**文档版本**: v1.0  
**创建日期**: 2026-03-09

<!-- test push Tue Mar 10 08:19:21 AM UTC 2026 -->
