# 图片背景去除工具 - MVP 需求文档

## 项目概述

**产品名称**: ImageMatte (暂定)  
**定位**: 在线 AI 图片背景去除工具  
**目标用户**: 电商卖家、设计师、自媒体从业者、个人用户  
**核心价值**: 一键去除图片背景，3 秒完成人像抠图，无需 PS 技能

---

## MVP 核心功能

### 1. 图片上传
- 支持格式: JPG, PNG, WEBP
- 文件大小限制: 10MB
- 分辨率限制: 最高 4K (4096×4096)
- 拖拽上传 + 点击选择
- 支持粘贴上传 (Ctrl+V)

### 2. AI 处理
- 调用 Replicate API (`cjwbw/rembg`)
- 自动去除背景
- 生成透明背景 PNG
- 处理时间: 3-5 秒

### 3. 结果预览与下载
- 实时预览处理结果
- 左右对比视图 (原图 vs 去背景)
- 棋盘格背景显示透明区域
- 一键下载 PNG 格式

### 4. 简单落地页
- Hero 区: 产品介绍 + 示例对比
- 上传区: 拖拽上传界面
- 功能说明: 3 个使用场景 (电商/设计/社交)
- 简单的使用说明

---

## 技术方案

### 前端
**技术栈**: Next.js 14 + TypeScript + Tailwind CSS

**核心页面**:
- `/` - 首页 + 上传 + 处理 + 结果（单页应用）

**关键功能**:
- 文件上传: `react-dropzone`
- 图片预览: Canvas 或 `<img>` 标签
- 对比视图: 左右分屏或滑块对比
- 加载状态: 处理中的 Loading 动画

### 后端
**技术栈**: Next.js API Routes (Cloudflare Pages Functions)

**API 端点**:
```
POST /api/remove-bg
  - 接收图片 (multipart/form-data 或 base64)
  - 调用 Replicate API
  - 返回处理后的图片 (base64)
```

**处理流程**:
1. 接收上传的图片（内存中）
2. 转换为 Replicate API 所需格式
3. 调用 Replicate API 处理
4. 等待处理完成（同步或轮询）
5. 返回处理后的图片（base64）
6. 前端接收并展示

### AI 服务
**方案**: Replicate API  
**模型**: `cjwbw/rembg` (Remove Background)  
**成本**: ~$0.01-0.02/张图片  
**处理时间**: 3-5 秒

### 存储
**方案**: 无存储（纯内存处理）  
**优势**:
- 无存储成本
- 无隐私问题
- 架构简单
- 处理完即释放

### 部署
- **平台**: Cloudflare Pages
- **CDN**: Cloudflare 全球加速
- **API**: Cloudflare Pages Functions
- **域名**: imagematte.com (待注册)

---

## 用户流程

### 主流程
```
1. 用户访问首页
   ↓
2. 拖拽/选择/粘贴图片上传
   ↓
3. 前端显示原图预览
   ↓
4. 点击"去除背景"按钮
   ↓
5. 显示处理中动画 (3-5 秒)
   ↓
6. 显示处理结果（左右对比）
   ↓
7. 点击"下载"按钮，保存 PNG
   ↓
8. 可以继续处理新图片
```

### 异常流程
- 上传失败 → 提示重试
- 文件过大 → 提示压缩或选择更小的图片
- 格式不支持 → 提示支持的格式
- API 处理失败 → 提示稍后重试

---

## 界面设计要点

### 首页布局

**Hero 区**:
- 标题: "AI 一键去除图片背景"
- 副标题: "3 秒抠图，无需 PS，支持 4K 高清"
- CTA 按钮: "立即试用"（滚动到上传区）

**示例对比**:
- 3-4 张示例图片
- 左右对比或滑块效果
- 场景: 人像/产品/宠物

**上传区**:
- 大号虚线框（居中）
- 图标 + 文字: "拖拽图片到这里"
- 或点击选择按钮
- 支持格式和大小说明
- 提示: "支持 Ctrl+V 粘贴"

**功能说明**:
- 3 个卡片: 
  - 电商产品图: 快速制作白底图
  - 设计素材: 提取人像做海报
  - 社交头像: 换背景色

### 处理中状态
- 原图显示（半透明）
- 中央 Loading 动画
- 文案: "AI 正在处理中..."
- 进度提示（可选）

### 结果展示
- 左右分屏:
  - 左侧: 原图
  - 右侧: 去背景结果（棋盘格背景）
- 或滑块对比（更直观）
- 下载按钮（大号，醒目）
- "处理新图片" 按钮

---

## 开发计划

### Day 1: 项目初始化
- [x] 创建 Next.js 项目
- [ ] 配置 TypeScript + Tailwind CSS
- [ ] 搭建基础页面结构
- [ ] 设计 UI 组件

### Day 2: 上传功能
- [ ] 实现拖拽上传
- [ ] 实现点击上传
- [ ] 实现粘贴上传
- [ ] 图片预览功能
- [ ] 文件验证（格式、大小）

### Day 3: AI 集成
- [ ] 注册 Replicate API
- [ ] 创建 `/api/remove-bg` 端点
- [ ] 集成 Replicate SDK
- [ ] 测试 API 调用
- [ ] 错误处理

### Day 4: 结果展示
- [ ] 处理结果预览
- [ ] 左右对比视图
- [ ] 下载功能
- [ ] 棋盘格背景
- [ ] 重新上传功能

### Day 5: 优化与部署
- [ ] UI 细节优化
- [ ] 移动端适配
- [ ] 性能优化
- [ ] Cloudflare Pages 部署
- [ ] 域名配置

---

## 成本预估

### 开发阶段 (前 1 个月)
- Cloudflare Pages: **免费**
- Replicate API: **$10-20** (测试 + 早期用户，约 500-1000 张)
- 域名: **$12/年** (~$1/月)
- **总计: ~$11-21/月**

### 增长阶段 (100 用户/天，每人 2 张)
- Replicate API: **$40-80** (200 张/天 × 30 天 × $0.01-0.02)
- Cloudflare Pages: **免费** (在免费额度内)
- **总计: ~$40-80/月**

### 规模化阶段 (1000 用户/天)
- Replicate API: **$400-800** (2000 张/天)
- 考虑自建 GPU 服务或批量折扣

---

## 商业化策略 (后续)

### 免费版
- 10MB 文件限制
- 标准处理速度
- 无水印
- 单张处理

### Pro 版 ($4.9/月)
- 20MB 文件限制
- 优先处理
- 批量上传（最多 10 张）
- API 访问

### 企业版 (定制)
- 无限制
- 私有部署
- 技术支持

---

## 技术风险与应对

### 风险 1: Replicate API 响应慢
**应对**: 
- 显示准确的预计时间
- 添加进度提示
- 考虑异步处理 + 轮询

### 风险 2: API 成本过高
**应对**:
- 设置每日处理上限
- 引入付费计划
- 后期考虑自建服务

### 风险 3: 图片质量不理想
**应对**:
- 提供多个 AI 模型选择
- 添加手动调整功能
- 收集用户反馈优化

### 风险 4: Cloudflare Pages Functions 限制
**应对**:
- 了解 CPU 时间限制（10-50ms）
- 如果超时，考虑异步处理
- 或迁移到 Cloudflare Workers

---

## 成功指标 (MVP 阶段)

- **用户量**: 100 个独立用户
- **转化率**: 50% 上传转化率 (访问 → 上传)
- **完成率**: 90% 处理完成率 (上传 → 下载)
- **处理速度**: 平均 5 秒内完成
- **用户反馈**: 收集 20+ 条真实反馈
- **技术稳定性**: 95% 处理成功率

---

## 下一步行动

1. **立即**: 注册 Replicate API Key
2. **Day 1**: 初始化 Next.js 项目
3. **Day 1**: 创建 GitHub 仓库
4. **Day 2**: 完成上传功能
5. **Day 3**: 集成 Replicate API
6. **Day 5**: 部署到 Cloudflare Pages

---

## 技术细节补充

### Replicate API 调用示例

```typescript
// /api/remove-bg/route.ts
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image") as File;
  
  // 转换为 base64 或 URL
  const imageBuffer = await image.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const dataUrl = `data:${image.type};base64,${base64Image}`;
  
  // 调用 Replicate API
  const output = await replicate.run(
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    {
      input: {
        image: dataUrl,
      }
    }
  );
  
  // 返回处理后的图片
  return Response.json({ 
    success: true, 
    image: output 
  });
}
```

### 前端上传组件示例

```typescript
// components/ImageUploader.tsx
import { useDropzone } from 'react-dropzone';

export function ImageUploader({ onUpload }) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (files) => {
      if (files[0]) {
        onUpload(files[0]);
      }
    }
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed p-12">
      <input {...getInputProps()} />
      <p>拖拽图片到这里，或点击选择</p>
    </div>
  );
}
```

---

**文档版本**: v1.0  
**创建日期**: 2026-03-09  
**负责人**: 小炼炼 🔥  
**审核人**: 姚路行
