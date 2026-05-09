# Love1 项目记忆文档

这是一份给后续 AI / 开发者快速接手项目用的长期记忆文档。

目标：
- 让后续接手的人快速理解整个项目
- 明确当前线上部署结构
- 明确哪些改动会影响部署配置
- 明确哪些数据存在数据库，哪些数据存在对象存储
- 记录已经踩过的坑，避免重复出问题

---

## 1. 项目定位

这是一个情侣纪念网站，核心由 3 部分组成：

1. 前台站点
   - 文件核心是 `you-and-me.html`
   - 面向情侣双方访问
   - 包含：首页、纪念日、相册、音乐、心动花园、设置页、情侣入口登录

2. 后台管理
   - 位于 `admin/`
   - Vue 3 + Vite + Element Plus
   - 用来管理前台内容、纪念日、相册、音乐、心动花园、隐私提醒等

3. 后端 API
   - 位于 `server/`
   - NestJS + Prisma + MySQL
   - 提供后台管理 API、前台公开 API、情侣入口 API、对象存储上传签名 API

---

## 2. 当前线上部署结构

### 2.1 当前实际部署

- 前台：Cloudflare Pages
- 后台：admin 子域名，Cloudflare Pages
- 后端 API：Render Web Service（免费实例）
- 数据库：TiDB Cloud（MySQL 兼容）
- 对象存储：Cloudflare R2
- DNS：Cloudflare
- 域名：`likeu.love`

### 2.2 当前线上域名规划

- 前台：
  - `https://likeu.love`
  - `https://www.likeu.love`

- 后台：
  - `https://admin.likeu.love`

- 后端 API：
  - `https://api.likeu.love`

- 媒体资源 / 对象存储公开域名：
  - `https://media.likeu.love`

---

## 3. 仓库结构总览

### 3.1 根目录关键文件

- `you-and-me.html`
  - 前台主页面核心文件
  - 非常大，包含大量 HTML / CSS / JS
  - 目前不是组件化前端，而是单文件主站

- `index.html`
  - 站点入口页 / 跳转辅助页

- `config.example.js`
  - 前台 API 地址模板
  - Pages 构建时会被复制成 `dist-web/config.js`

- `config.js`
  - 本地开发时可能存在的实际配置

- `render.yaml`
  - Render 后端部署配置

- `package.json`
  - Monorepo 根配置
  - 包含 workspaces：`server`、`admin`

- `scripts/build-web.js`
  - 前台静态构建脚本
  - 会把 `you-and-me.html` 复制到 `dist-web/`
  - 会生成：
    - `dist-web/you-and-me.html`
    - `dist-web/you-and-me/index.html`
    - `dist-web/index.html`
    - `dist-web/config.js`
    - `dist-web/heart-garden/`

### 3.2 后端目录

- `server/src/main.ts`
  - Nest 启动入口
  - 设置了全局前缀 `/api`
  - 设置了 `CORS_ORIGINS`
  - body 限制目前是 `25mb`

- `server/src/modules/`
  - `admin.controller.ts`
    - 后台管理 API
  - `admin-auth.controller.ts`
    - 后台登录
  - `admin-auth.guard.ts`
    - 后台 JWT 鉴权
  - `public.controller.ts`
    - 前台公开读取接口
  - `couple.controller.ts`
    - 情侣入口登录后的前台可写接口
  - `couple-auth.controller.ts`
    - 情侣入口登录
  - `couple-auth.guard.ts`
    - 情侣 JWT 鉴权
  - `content.service.ts`
    - 内容主业务逻辑，整个项目最关键的服务文件之一
  - `storage.service.ts`
    - R2 / S3 兼容对象存储逻辑
  - `types.ts`
    - 前后端共享的内容结构类型定义
  - `auth.service.ts`
    - 后台管理员认证逻辑

- `server/prisma/schema.prisma`
  - 数据库模型定义

- `server/prisma/seed.js`
  - 初始化默认数据
  - 注意：现在不能再在应用启动时自动 seed，避免覆盖用户内容

### 3.3 后台目录

- `admin/src/App.vue`
  - 后台单页核心文件
  - 功能很多，改后台大概率要看这里

- `admin/src/api.ts`
  - 后台 API 封装
  - `VITE_API_BASE` 从 Cloudflare Pages 环境变量读取

- `admin/src/styles.css`
  - 后台全局样式

### 3.4 爱心代码 / 心动花园素材目录

- `爱心代码合集/`
  - 用户收集的大量浪漫爱心代码、HTML 小项目
  - 其中一部分已接入“心动花园”

注意：
- 这个目录是业务资产来源之一，不要轻易删除或重命名

---

## 4. 数据模型大体说明

### 4.1 核心数据库模型

- `CoupleSpace`
  - 一个情侣空间，目前默认 slug 是 `default`

- `SiteConfig`
  - 前台站点配置大 JSON
  - 重要：很多首页/设置/心动花园/音乐等都存在 `settings` 这个 JSON 里

- `ThemeConfig`
  - 主题颜色、背景图、模糊、亮度、粒子效果等

- `Anniversary`
  - 纪念日管理数据

- `Album`
  - 相册分类

- `MediaAsset`
  - 媒体资源记录
  - 现在数据库只保存元数据和 URL，不存二进制文件本体

- `AlbumItem`
  - 相册项，关联 `MediaAsset`

- `Song`
  - 音乐条目

- `Playlist`
  - 播放列表

- `PlaylistItem`
  - 歌单和歌曲的关联关系

- `LoveLetter`
  - 情书

### 4.2 当前大量前台配置并不是拆表，而是存在 `SiteConfig.settings`

例如：
- 首页头图文
- 心动指数
- 首页甜蜜时刻 `moments`
- 首页未来约定 `promises`
- 音乐设置 `music`
- 登录页文案 `coupleEntrance`
- 纪念页设置 `anniversaryPage`
- 心动花园 `heartGarden.projects`

所以后续 AI 改这块时，要先判断：
- 是在独立表里
- 还是在 `settings` 里

不要一上来就以为所有东西都在表里。

---

## 5. 当前媒体存储策略

### 5.1 现在的正确存储方式

现在图片 / 视频 / 音频 / 心动花园项目素材，应该优先走：

- 上传文件 -> R2 对象存储
- 数据库只保存：
  - `objectKey`
  - `url`
  - `thumbnailUrl`
  - `mimeType`
  - `size`
  - 业务元数据

### 5.2 为什么以前会“数据库里有，R2 桶里没有”

历史上有过两个阶段：

1. 早期一些内容直接以 URL / base64 / 默认文本方式写进数据库配置
2. 后来才逐步切到 R2

因此：
- 老数据不一定都在 R2
- 新上传的数据才会逐步走 R2

这不是用户看错，是项目历史演进造成的

### 5.3 R2 当前用途

当前已经接入 R2 的大项包括：

- 头像
- 页面头图
- 登录页图片
- 相册图片 / 视频
- 音乐封面
- 音乐文件
- 心情歌单封面
- 心动花园封面
- 心动花园项目素材

### 5.4 R2 文件夹组织规则

当前后端在 `storage.service.ts` 里会按用途自动分目录。

注意：
- `storage.service.ts` 里的中文目录名当前有编码历史问题，部分源码显示为乱码
- 这不代表逻辑坏了
- 后续 AI 不要随手“顺手修一下这些中文目录名”，否则会破坏线上 objectKey 路径兼容

如果真要统一目录名，必须：
- 做完整迁移方案
- 批量改数据库 URL / objectKey
- 明确通知用户要重新部署

在没有迁移方案前，不要动。

---

## 6. 前台运行方式

### 6.1 前台不是标准 Vue/React 工程

前台当前核心是：
- `you-and-me.html`

里面直接包含：
- 页面结构
- 大量样式
- 大量前端逻辑

这是当前项目的现实，不要误判成“组件化站点”。

### 6.2 构建方式

执行：

```bash
npm run build:web
```

会调用：

```bash
node scripts/build-web.js
```

生成 `dist-web/`，供 Cloudflare Pages 部署。

### 6.3 前台 API 地址来源

前台运行时会读：

```js
window.LOVE1_API_BASE
```

来源：
- `config.example.js` 在构建时复制成 `dist-web/config.js`

当前线上应指向：

```js
window.LOVE1_API_BASE = 'https://api.likeu.love/api';
```

### 6.4 前台访问路径

Cloudflare Pages 最终可访问：

- `/you-and-me.html`
- `/you-and-me/`

构建脚本已同时生成这两个入口。

---

## 7. 后台运行方式

后台是单独的 Vite 项目。

本地开发：

```bash
npm --workspace admin run dev
```

构建：

```bash
npm --workspace admin run build
```

当前后台线上环境变量：

```text
VITE_API_BASE=https://api.likeu.love
```

注意：
- 这里不要带 `/api`
- 因为后台代码调用时路径本身已经写了 `/api/...`

---

## 8. 后端运行方式

本地开发：

```bash
npm --workspace server run start:dev
```

构建：

```bash
npm --workspace server run build
```

Prisma：

```bash
npm --workspace server run prisma:generate
npm --workspace server run prisma:push
npm --workspace server run prisma:migrate
npm --workspace server run prisma:seed
```

注意：
- 当前 Render 构建用的是 `prisma:push`
- 不是 `prisma migrate deploy`
- 这是为了避免历史 migration/provider 问题再次卡死

---

## 9. 当前线上部署配置

### 9.1 Render 后端

当前 `render.yaml` 中的关键配置：

- Build:

```bash
npm install --include=dev && npm --workspace server run prisma:generate && npm --workspace server run prisma:push && npm --workspace server run build
```

- Start:

```bash
npm --workspace server run start
```

重要：
- 不能再把 `seed.js` 放到启动命令里
- 否则会重置用户内容

### 9.2 Render 必备环境变量

后端当前至少依赖这些：

- `DATABASE_URL`
- `CORS_ORIGINS`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL`
- `COUPLE_LOGIN_NAME`
- `COUPLE_LOGIN_PASSWORD`
- `COUPLE_JWT_SECRET`

### 9.3 Cloudflare Pages：前台

建议配置：

- Build command:

```bash
npm install && npm run build:web
```

- Output:

```text
dist-web
```

### 9.4 Cloudflare Pages：后台

建议配置：

- Root directory:

```text
admin
```

- Build command:

```bash
npm install && npm run build
```

- Output:

```text
dist
```

---

## 10. 只要改这些内容，就必须提醒用户检查部署配置

后续 AI 如果改到下面任意一类内容，必须主动告诉用户“部署哪里需要改”：

### 10.1 改环境变量时

如果改了以下任一逻辑，必须提醒用户去 Render 或 Cloudflare Pages 改环境变量：

- 后端 API 基地址变化
- 新增鉴权密钥
- 改 CORS 来源
- 改数据库连接
- 改对象存储配置
- 改情侣入口账号密码来源

### 10.2 改构建命令时

如果改了以下内容，必须提醒用户检查部署平台的 Build / Start 配置：

- `render.yaml`
- `scripts/build-web.js`
- `package.json` scripts
- `admin/package.json`
- `server/package.json`

### 10.3 改路由或域名依赖时

如果改了：
- `config.example.js`
- 前台 API 地址读取逻辑
- 自定义域名访问路径

必须提醒用户检查：
- 前台 Pages
- 后台 Pages
- Cloudflare DNS
- Render Custom Domain

---

## 11. 当前已知平台限制

### 11.1 Render 免费实例冷启动

现象：
- 第一次打开网站可能要十几秒到几十秒
- API 第一次请求也会慢

这不是纯前端代码问题，主要是：
- Render Free 实例休眠
- 第一次请求要唤醒

当前已做过的缓解：
- 页面保活思路
- 一些接口超时和重试优化

但它依然不是“秒开”。

### 11.2 浏览器自动播放限制

即使设置里开了“自动播放”，浏览器仍可能拦截首次有声自动播放。

当前策略：
- 页面进入时先尝试播放
- 如果被拦截，第一次用户交互后自动续播

这属于浏览器策略，不是代码能 100% 绕过。

### 11.3 前台是单文件，维护成本高

`you-and-me.html` 很大，优点是部署简单，缺点是：
- 修改容易牵一发动全身
- 移动端和 PC 端样式要特别小心
- 很多逻辑都耦合在一起

后续 AI 修改时必须：
- 尽量做局部改动
- 不要因为想“重构得更优雅”就大面积重写

---

## 12. 当前重要业务约定

### 12.1 情侣入口

情侣入口登录后，前台才允许做部分写操作，例如：
- 相册上传
- 未来约定打勾
- 其他情侣前台可写行为

所以如果前台某个写操作失败，要先检查：
- 是否已经登录情侣入口
- `COUPLE_LOGIN_NAME / COUPLE_LOGIN_PASSWORD / COUPLE_JWT_SECRET` 是否正确
- 前台 token 是否过期

### 12.2 后台管理员

后台登录使用：
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_JWT_SECRET`

后续 AI 不要把后台写操作做成无需鉴权。

### 12.3 Seed 不能覆盖用户内容

这是一个非常重要的历史结论：

以前把 seed 放在启动阶段，会导致：
- 重部署后用户上传内容丢失
- 页面恢复默认测试数据

现在必须坚持：
- seed 只用于初始化
- 不能在应用启动时自动执行

---

## 13. 当前业务功能概况

### 13.1 首页

包括：
- 头图文
- About 区
- 甜蜜时刻 `moments`
- 未来约定 `promises`
- 爱的信箱
- 相册缩略区

说明：
- 甜蜜时刻：首页纵向时间列表
- 未来约定：支持前台打勾，状态要同步后端

### 13.2 纪念页

包括：
- 日历
- 重要时刻横向时间轴
- 倒计时
- 今日小语

说明：
- `520/521/情人节/七夕` 这类目前还有一层前台内置节日逻辑
- 不完全来自后台纪念日表

### 13.3 相册页

包括：
- 标签筛选
- 图片 / 视频展示
- 前台上传
- 后台管理

说明：
- 布局最近做过一轮优化
- 大图 + 右侧小图的网格比例是业务关注点

### 13.4 音乐页

包括：
- 播放器
- 歌词滚动展示
- 心情歌单
- 播放列表

说明：
- 歌词支持 `.lrc / .txt`
- 后台支持上传歌词文件，不再要求手写大段歌词
- 当前歌词高亮居中逻辑做过多轮修复，是敏感区域

### 13.5 心动花园

包括：
- 老项目直接 HTML 展示
- 后台项目管理
- 多文件代码编辑
- 项目素材上传
- 相对路径自动转 R2 URL

说明：
- 当前不做 ZIP 上传自动解压
- 更推荐“后台代码编辑 + 新建文件 + 上传素材”的方式

### 13.6 设置页

包括：
- 资料卡片
- 主题外观
- 纪念日联动
- 音乐设置
- 隐私提醒

说明：
- 移动端设置页做过较多适配
- 不要轻易破坏 PC 端现有布局

### 13.7 AI 小助手

包括：
- 后台 AI 导航页配置模型、API Key、性格、记忆、每日消息上限
- 前台悬浮聊天入口、历史会话、快捷按钮
- AI 可以读取网站摘要、长期记忆和最近对话
- 待确认操作支持新增纪念日、新增重要时刻、新增未来约定、保存情书草稿、修改提醒设置
- 待确认操作有细分权限：允许新增纪念日、允许新增重要时刻、允许新增未来约定、允许保存情书草稿、允许修改提醒设置
- 新增纪念日、新增重要时刻、新增未来约定、保存情书草稿、修改提醒设置的前台确认卡片支持确认前编辑，最终确认 payload 会写回 AI 操作记录

说明：
- AI 不应直接静默写入数据；需要前台确认卡片确认后才写入
- 新增重要时刻写入 `settings.anniversaryPage.importantMoments`，用于纪念日页“我们的重要时刻”横向时间线
- 修改提醒设置目前写入 `settings.reminders`
- `AiProviderConfig.actionEnabled` 是总开关，细分权限只在总开关开启时生效

---

## 14. 当前一些重要同步关系

后续 AI 修改时，要特别注意这些联动：

### 14.1 首页资料卡片

资料卡片会影响多个页面左侧 / 顶部的同类信息展示，例如：
- 头像
- `You & Me`
- 副标题
- 标签文案

不能只改首页某一处文本，要看是不是复用源。

### 14.2 纪念日页面配置

`anniversaryPage` 里的：
- `startDate`
- `startTitle`
- `firstMeetDate`

会和：
- 日历展示
- 倒计时
- 部分默认纪念项
联动

改动时要注意清理旧残留数据。

### 14.3 音乐删除

删歌时不只是删 `Song`：
- 还要删 `PlaylistItem`
- 还要清掉 `settings.music.bgmSongId`
- 还要把 `settings.music.moodPlaylists[].songIds` 里的该歌曲剔除

否则前台 / 后台会不同步。

### 14.4 心动花园项目素材

项目里的 HTML / CSS / JS 可以引用项目内部素材。

当前支持：
- 相对路径素材引用自动转换
- 站内已有素材复用

后续如果改动这块，要同时确认：
- 后台项目保存
- 前台 iframe 预览
- R2 资源路径

---

## 15. 目前已经踩过的坑

### 15.1 Prisma migration provider 问题

历史上出现过：
- migration 目录里 provider 不匹配
- 导致 Render 构建失败

所以当前 Render 使用：

```bash
prisma db push
```

不是传统 `migrate deploy`。

### 15.2 心动花园相对路径资源打不开

已修复：
- HTML 里的 `src / href / poster / srcset`
- CSS 里的 `url(...)`

会自动转成线上可访问地址。

### 15.3 未来约定勾选乱跳 / 看起来像勾多个

根因曾经包括：
- 前端 optimistic 更新 + 失败回滚造成乱跳
- `done` 没完整落库
- 某些默认 icon 太像勾选视觉
- Render 冷启动导致写请求超时

这块后续改动要非常谨慎。

### 15.4 歌词滚动乱跳

歌词展示不是简单 `scrollTop` 就能做好。

正确方向是：
- 当前行始终尽量在中线
- 用轨道平移而不是让整个容器乱滚
- 当前行高亮，其他行按距离渐隐

这块改坏很容易复发。

---

## 16. 后续 AI 修改时的建议工作流

建议顺序：

1. 先看这份文档
2. 再看用户当前要改的是：
   - 前台单文件
   - 后台 Vue
   - 后端 Nest
   - 数据库 / R2 / 部署
3. 小改优先局部修，不要大重构
4. 改完至少做对应构建验证

常用验证：

```bash
npm --workspace server run build
npm --workspace admin run build
npm run build:web
```

如果改了 Prisma：

```bash
npm --workspace server run prisma:generate
```

---

## 17. 后续 AI 必须遵守的协作约定

### 17.1 如果改了部署相关内容，必须明确告诉用户

尤其是：
- 要不要改 Render 环境变量
- 要不要改 Cloudflare Pages 环境变量
- 要不要改 DNS / 域名绑定
- 要不要手动重新部署

不能只改代码不说部署影响。

### 17.2 不要默认删除用户现有数据

包括：
- 数据库内容
- R2 对象
- 爱心代码合集素材

除非用户明确要求。

### 17.3 不要轻易改中文目录 / objectKey 规则

因为这会影响：
- 数据库 URL
- R2 文件路径
- 心动花园资源引用

### 17.4 不要擅自大改前台架构

前台现在虽然是单文件，但这是当前稳定运行方式。

如果未来真要拆分：
- 必须先给用户方案
- 明确说明部署会受影响
- 明确说明回归测试范围

---

## 18. 推荐后续补充方向

如果未来继续迭代，优先级较高的方向：

1. 把“前台内置节日”搬到后台配置
2. 继续清理后台所有“小按钮”保存/删除体验
3. 继续强化移动端体验
4. 继续让心动花园编辑器更接近小型在线项目编辑器
5. 视情况把前台大文件逐步拆分，但这属于中大改动

---

## 19. 最后一句给接手 AI

这个项目不是一个“从零新建、结构完美”的标准 SaaS，它是一个已经上线、不断在真实使用中迭代出来的情侣网站。

所以接手时最重要的不是“把它改得多优雅”，而是：
- 先理解现状
- 不破坏已有线上内容
- 改完要和部署链路对上
- 任何可能影响线上配置的改动，都要明确告诉用户

稳，比炫技更重要。
