# You & Me 前端项目后端与后台系统设计建议

## 1. 当前项目理解

当前项目只有一个静态页面文件 `you-and-me.html`，页面已经具备完整的情侣空间前台视觉雏形，但所有内容都硬编码在 HTML、CSS、内联 JS 中。

已有前台模块：

- 首页：情侣资料、心动统计、故事简介、甜蜜时刻、未来约定、爱的信箱、专属歌单。
- 纪念日：日历、重要日期、倒计时、横向时间线、纪念文案。
- 相册：分类、排序、上传按钮样式、精选照片、小图网格、今日回忆。
- 音乐盒：唱片播放器 UI、播放列表、今日推荐、歌词片段、最近播放。
- 设置页：个人信息、主题外观、纪念设置、音乐设置、隐私访问、消息提醒、主题预览。
- 情书弹窗：三封情书内容由 JS 数组写死。

当前主要限制：

- 无后端、无数据库、无登录鉴权，设置保存只是前端 Toast。
- 图片、文案、日期、歌曲、情书、统计数据全部写死，无法后台维护。
- 上传按钮、音乐播放、日历切换、隐私开关等大多只是静态交互。
- 图片来自外部 Unsplash 链接，生产环境应改为自有对象存储或 CDN。
- 倒计时目标写死为 `2025-05-20T00:00:00`。以当前日期 `2026-05-02` 看，这个日期已经过去，后端应动态计算“下一次纪念日”。

## 2. 建议目标

建议把这个项目定位为“私密情侣空间”产品，而不是普通展示页 CMS。后端需要同时解决内容管理、媒体管理、隐私访问、纪念日提醒和前台数据聚合。

核心目标：

- 前台页面数据从后端读取，保留现有视觉效果。
- 后台系统可以管理资料、纪念日、相册、情书、音乐、主题和访问权限。
- 支持图片/视频/音频上传、缩略图、排序、收藏、私密可见。
- 支持访问密码、分享链接、后台账号、操作日志。
- 支持后续扩展为多情侣空间或多用户空间。

## 3. 推荐技术栈

### 后端

推荐：`Node.js + NestJS + Prisma + PostgreSQL`

原因：

- 当前前端是 HTML/JS，团队后续接入 API 会比较自然。
- NestJS 模块化清晰，适合拆成用户、相册、纪念日、设置等业务模块。
- Prisma 管理数据模型和迁移效率高。
- PostgreSQL 能稳定承载结构化数据、JSON 配置、全文搜索和后续扩展。

配套组件：

- Redis：缓存前台首页聚合数据、限流、验证码、任务队列。
- 对象存储：生产用阿里云 OSS、腾讯云 COS、七牛云、S3；本地开发用 MinIO。
- 图片处理：Sharp 生成缩略图、WebP、压缩图。
- 后台任务：BullMQ，处理缩略图、媒体转码、提醒通知。
- API 文档：Swagger/OpenAPI。

### 后台前端

推荐：`Vue 3 + Vite + TypeScript + Element Plus`

原因：

- 后台管理表单、表格、上传、弹窗多，Element Plus 成熟省时。
- Vue 与现有静态前端迁移成本低。
- 可以快速搭建登录、菜单、CRUD、上传、富文本编辑器。

可选配套：

- Pinia：后台用户状态和全局配置。
- Vue Router：后台路由权限。
- Axios：API 请求封装。
- WangEditor / TipTap：情书、故事、每日一句等富文本编辑。
- ECharts：心动指数、内容统计、访问统计。

## 4. 推荐整体架构

```text
Browser
  |-- 前台静态页面 / Web App
  |     |-- 调用 /api/public/*
  |
  |-- 后台管理系统 / Admin
        |-- 调用 /api/admin/*

Nginx
  |-- /              -> 前台页面
  |-- /admin         -> 后台静态资源
  |-- /api           -> NestJS API
  |-- /uploads 或 CDN -> 媒体资源

NestJS API
  |-- AuthModule
  |-- SpaceModule
  |-- ProfileModule
  |-- AnniversaryModule
  |-- AlbumModule
  |-- MediaModule
  |-- LetterModule
  |-- MusicModule
  |-- ThemeModule
  |-- ShareModule
  |-- NotificationModule

PostgreSQL + Redis + Object Storage
```

建议先做“模块化单体”，不要一开始拆微服务。这个项目业务边界清楚，单体更快、更稳，后续流量或团队变大再拆。

## 5. 核心业务模型

### 5.1 用户与空间

- `users`：后台用户、情侣双方账号。
- `couple_spaces`：情侣空间，一个空间对应一套前台页面。
- `space_members`：空间成员和角色，支持 owner、partner、admin、viewer。
- `sessions` / `refresh_tokens`：登录会话。
- `audit_logs`：后台操作日志。

### 5.2 资料与首页

- `profiles`：双方资料、昵称、头像、称呼、简介。
- `site_configs`：站点标题、副标题、首页文案、统计展示配置。
- `theme_configs`：主题色、背景图、模糊度、亮度、粒子开关、花瓣开关、玻璃质感开关。
- `daily_quotes`：每日一句、爱的信箱文案。

### 5.3 纪念日

- `anniversaries`：纪念日标题、日期、类型、是否每年重复、提醒规则。
- `timeline_events`：时间线事件，支持标题、日期、地点、描述、封面图、排序。
- `reminders`：提醒任务，支持提前 N 天、当天提醒、是否已发送。

### 5.4 相册与媒体

- `albums`：相册分类，例如旅行、日常、约会、夜晚。
- `media_assets`：媒体文件，统一存图片、视频、音频、封面和缩略图。
- `album_items`：相册内容，包含标题、描述、拍摄日期、地点、标签、收藏状态、可见性。
- `media_tags`：标签。
- `trash_items`：回收站，可选。

### 5.5 情书与内容

- `love_letters`：情书标题、内容、署名、日期、状态、排序。
- `future_promises`：未来约定。
- `mailbox_messages`：爱的信箱或留言。

### 5.6 音乐

- `songs`：歌曲名称、歌手、时长、歌词片段、封面、音频地址或外链。
- `playlists`：歌单。
- `playlist_items`：歌单歌曲排序。
- `play_history`：最近播放记录。

注意：如果使用真实歌曲音频，需要确认版权。MVP 阶段建议先只管理歌曲元数据、封面和外部可播放链接，不直接托管商业音乐文件。

### 5.7 隐私与分享

- `access_policies`：访问模式，公开、密码访问、仅登录可见。
- `share_links`：分享链接、过期时间、访问次数限制、是否允许查看私密相册。
- `visitor_logs`：访问记录，用于排查和统计。

## 6. MVP 数据表建议

第一阶段不要一次性建太多表，建议先落以下核心表：

```text
users
couple_spaces
space_members
profiles
site_configs
theme_configs
anniversaries
timeline_events
albums
media_assets
album_items
love_letters
songs
playlists
playlist_items
share_links
audit_logs
```

其中 `site_configs`、`theme_configs` 可以使用 JSON 字段保存前台配置，这样能快速覆盖当前页面的大量展示项。

## 7. API 设计建议

### 7.1 前台公开接口

前台优先使用聚合接口，避免页面打开时请求过多。

```http
GET /api/public/spaces/:slug/bootstrap
```

返回建议：

- 空间基础信息：标题、副标题、slug、访问模式。
- 双方资料：头像、昵称、称呼、简介。
- 首页统计：心动天数、甜蜜瞬间数、纪念日数量。
- 主题配置：颜色、背景、特效开关。
- 首页模块：故事、甜蜜时刻、未来约定、爱的信箱、推荐歌单。
- 下一纪念日：名称、日期、倒计时秒数。

其他前台接口：

```http
GET /api/public/spaces/:slug/anniversaries
GET /api/public/spaces/:slug/timeline
GET /api/public/spaces/:slug/albums
GET /api/public/spaces/:slug/albums/:albumId/items
GET /api/public/spaces/:slug/music/playlists
GET /api/public/spaces/:slug/letters
POST /api/public/spaces/:slug/access-password
POST /api/public/spaces/:slug/reactions
```

### 7.2 后台认证接口

```http
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/refresh
GET  /api/admin/auth/me
```

### 7.3 后台管理接口

```http
GET    /api/admin/spaces/:spaceId/dashboard
PATCH  /api/admin/spaces/:spaceId/site-config
PATCH  /api/admin/spaces/:spaceId/theme-config

GET    /api/admin/spaces/:spaceId/profiles
PATCH  /api/admin/spaces/:spaceId/profiles/:profileId

GET    /api/admin/spaces/:spaceId/anniversaries
POST   /api/admin/spaces/:spaceId/anniversaries
PATCH  /api/admin/spaces/:spaceId/anniversaries/:id
DELETE /api/admin/spaces/:spaceId/anniversaries/:id

GET    /api/admin/spaces/:spaceId/albums
POST   /api/admin/spaces/:spaceId/albums
PATCH  /api/admin/spaces/:spaceId/albums/:id
DELETE /api/admin/spaces/:spaceId/albums/:id

POST   /api/admin/spaces/:spaceId/media/upload-url
POST   /api/admin/spaces/:spaceId/media/complete
GET    /api/admin/spaces/:spaceId/media
PATCH  /api/admin/spaces/:spaceId/media/:id
DELETE /api/admin/spaces/:spaceId/media/:id

GET    /api/admin/spaces/:spaceId/letters
POST   /api/admin/spaces/:spaceId/letters
PATCH  /api/admin/spaces/:spaceId/letters/:id
DELETE /api/admin/spaces/:spaceId/letters/:id

GET    /api/admin/spaces/:spaceId/music/playlists
POST   /api/admin/spaces/:spaceId/music/playlists
PATCH  /api/admin/spaces/:spaceId/music/songs/:id

GET    /api/admin/spaces/:spaceId/share-links
POST   /api/admin/spaces/:spaceId/share-links
PATCH  /api/admin/spaces/:spaceId/access-policy
```

## 8. 媒体上传流程

建议采用直传对象存储，后端只签发上传凭证和记录元数据。

```text
1. 后台选择图片/视频
2. 调用 POST /api/admin/spaces/:spaceId/media/upload-url
3. 后端校验权限、文件类型、大小，返回 signed URL 和 object key
4. 前端直传对象存储
5. 前端调用 POST /api/admin/spaces/:spaceId/media/complete
6. 后端写入 media_assets，异步生成缩略图和压缩图
7. 相册引用 media_assets
```

上传限制建议：

- 图片：jpg、png、webp、heic，单张建议不超过 20MB。
- 视频：mp4、mov，MVP 可先只上传并展示，不做复杂转码。
- 音频：mp3、m4a，注意版权和访问控制。
- 默认去除图片 EXIF，避免泄露地理位置。

## 9. 后台系统模块建议

### 9.1 登录与权限

- 后台登录页。
- 修改密码。
- 角色控制：超级管理员、空间管理员、内容编辑、只读访客。
- 登录失败限流。
- 后台操作日志。

### 9.2 仪表盘

- 心动天数、照片数、视频数、纪念日数、情书数。
- 最近上传照片。
- 最近纪念日。
- 当前访问模式。
- 存储容量使用情况。

### 9.3 资料管理

- 空间名称：例如 You & Me。
- 首页标题、副标题、故事简介。
- 双方头像、昵称、专属称呼。
- 首页统计展示项。
- 页面导航是否显示。

### 9.4 纪念日管理

- 新增、编辑、删除纪念日。
- 是否每年重复。
- 是否首页倒计时展示。
- 日历标签颜色。
- 提醒时间：提前 1 天、3 天、7 天。
- 时间线事件排序。

### 9.5 相册管理

- 相册分类管理。
- 图片/视频批量上传。
- 封面设置。
- 标签、地点、拍摄时间。
- 收藏、置顶、精选。
- 拖拽排序。
- 私密/公开切换。
- 回收站。

### 9.6 情书与文案管理

- 情书列表。
- 富文本编辑。
- 草稿、发布、隐藏。
- 弹窗 Tab 排序。
- 每日一句、爱的信箱、未来约定管理。

### 9.7 音乐盒管理

- 歌单管理。
- 歌曲元数据管理：歌名、歌手、时长、封面、歌词片段。
- 推荐歌曲。
- 最近播放是否记录。
- 背景音乐选择。
- 自动播放开关。

### 9.8 主题与前台设置

- 主题色。
- 背景图。
- 背景模糊、亮度。
- 粒子特效、花瓣飘落、玻璃质感开关。
- 首屏图、各页面 header 图。
- 自定义 CSS 变量，谨慎开放。

### 9.9 隐私与分享

- 访问密码开关。
- 密码修改。
- 私密相册开关。
- 分享链接创建、失效、访问次数限制。
- 访客访问日志。
- 防止未授权访问原图。

### 9.10 消息提醒

- 纪念日提醒。
- 每日一句提醒。
- 惊喜提醒。
- 通知方式可先预留：邮件、短信、微信服务号、企业微信机器人。

## 10. 前台改造建议

建议分三步，不必一开始重写整个页面。

### 第一步：保留 HTML，接入 bootstrap 数据

在当前页面新增 API 请求：

```js
async function loadSpace() {
  const res = await fetch('/api/public/spaces/default/bootstrap');
  const data = await res.json();
  renderProfile(data.profiles);
  renderTheme(data.theme);
  renderHome(data.home);
  renderNextAnniversary(data.nextAnniversary);
}
```

先替换这些硬编码内容：

- `profile-name`
- 头像图片
- 首页标题和副标题
- 心动天数、甜蜜瞬间、共同约定
- 倒计时日期
- 情书数组
- 相册图片
- 歌单列表
- 设置页初始值

### 第二步：抽离静态资源和业务 JS

建议拆成：

```text
public/
  you-and-me.html
  assets/
    app.css
    app.js
    renderers/
      home.js
      anniversary.js
      album.js
      music.js
      settings.js
```

这样可以在不引入完整前端框架的前提下，先降低维护成本。

### 第三步：需要持续迭代时迁移为 Web App

如果后续要做登录、上传、路由、复杂状态，建议迁移为：

```text
apps/
  web/      # 前台 Vue 或 React
  admin/    # 后台 Vue
  api/      # NestJS API
packages/
  shared/   # 类型、校验 schema、工具函数
```

如果只是个人或小范围使用，当前静态 HTML + API 渲染即可，没必要立刻重构为复杂 SPA。

## 11. 安全建议

- 后台密码使用 Argon2 或 bcrypt 加密。
- 后台接口使用 JWT access token + refresh token，或安全 Cookie Session。
- 如果使用 Cookie，开启 HttpOnly、Secure、SameSite，并处理 CSRF。
- 所有后台写接口校验角色和空间归属。
- 上传文件校验 MIME、后缀、大小，不信任前端传参。
- 原图默认私有，通过签名 URL 或后端鉴权代理访问。
- 访问密码只存 hash，不存明文。
- 对登录、访问密码、分享链接接口做限流。
- 记录关键操作日志：登录、删除照片、改密码、改访问策略、生成分享链接。
- 前台增加 CSP，减少 XSS 风险。
- 富文本内容做 XSS 清洗。

## 12. 部署建议

### MVP 部署

```text
Docker Compose
  nginx
  api
  admin
  postgres
  redis
  minio
```

生产环境建议：

- 前台和后台静态资源走 Nginx 或 CDN。
- API 独立服务进程。
- PostgreSQL 定时备份。
- 对象存储开启版本控制或生命周期策略。
- `.env` 管理数据库、JWT、对象存储密钥。
- HTTPS 必须开启，尤其是访问密码和后台登录。

### 环境划分

```text
local       本地开发
staging     测试环境
production  正式环境
```

## 13. 分阶段实施计划

### Phase 0：整理当前前端

- 修正编码与资源路径，确保文件统一 UTF-8。
- 标记所有硬编码数据。
- 抽出 `app.js` 和 `app.css`。
- 定义前台 bootstrap JSON 结构。

### Phase 1：后端 MVP

- 初始化 NestJS、Prisma、PostgreSQL。
- 完成后台登录。
- 完成空间、资料、站点配置、主题配置。
- 完成纪念日、时间线、情书 CRUD。
- 前台接入 `/api/public/spaces/:slug/bootstrap`。

### Phase 2：相册与媒体

- 接入对象存储。
- 完成上传、缩略图、相册分类。
- 完成相册后台管理。
- 前台相册页改为接口数据。

### Phase 3：音乐与设置

- 完成歌曲、歌单管理。
- 完成背景音乐设置。
- 完成前台设置保存到后端。
- 完成主题实时预览。

### Phase 4：隐私、分享与提醒

- 完成访问密码。
- 完成分享链接。
- 完成访问日志。
- 完成纪念日提醒任务。
- 增加备份、监控和错误日志。

## 14. 推荐优先级

最先做：

1. 后台登录和空间配置。
2. 首页资料、标题、主题配置。
3. 纪念日和倒计时动态化。
4. 情书内容后台管理。
5. 相册上传和展示。

可以后置：

1. 音乐真实播放。
2. 复杂提醒。
3. 多空间多租户。
4. 访问统计图表。
5. 视频转码。

## 15. 建议仓库结构

如果继续保持轻量：

```text
love1/
  public/
    you-and-me.html
    assets/
      app.css
      app.js
  server/
    src/
    prisma/
    package.json
  admin/
    src/
    package.json
  docker-compose.yml
  backend-admin-design.md
```

如果准备产品化：

```text
love1/
  apps/
    api/
    admin/
    web/
  packages/
    shared/
  infra/
    nginx/
    docker/
  docs/
    backend-admin-design.md
```

## 16. 总结建议

这个项目的前台视觉已经足够完整，后端重点不是重新设计页面，而是把“写死的数据”变成“可管理的情侣空间内容”。建议先走模块化单体架构，用 NestJS + PostgreSQL + 对象存储把资料、纪念日、相册、情书、音乐和主题配置打通；后台用 Vue 3 + Element Plus 快速落地管理能力。

第一版不要追求大而全，先让后台能改首页、纪念日、情书、相册，这样前台页面马上就从静态模板变成可运营、可维护的真实系统。
