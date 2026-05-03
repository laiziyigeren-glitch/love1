# You & Me 全栈工程

这个目录现在包含三个部分：

- `you-and-me.html`：现有前台静态页面。
- `server/`：NestJS API，按 MySQL + Prisma + 对象存储设计。
- `admin/`：Vue 3 + Element Plus 后台管理系统。

## 目录

```text
love1/
  admin/                  Vue 3 后台管理
  server/                 NestJS API
  server/prisma/          PostgreSQL 数据模型
  docker-compose.yml      备用容器依赖
  .env.example            环境变量示例
  you-and-me.html         当前前台页面
```

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

复制 `.env.example` 为 `.env`，按需修改数据库和对象存储配置。

3. 准备 MySQL

当前项目默认使用本机 MySQL：

```text
host: localhost
port: 3306
user: root
password: 123456
database: love1
```

创建数据库：

```bash
mysql -uroot -p123456 -e "CREATE DATABASE IF NOT EXISTS love1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

如果 Prisma `db push` 被 Windows 权限拦截，可以直接执行项目内置 SQL：

```bash
cmd /c "mysql -uroot -p123456 love1 < server\prisma\mysql-init.sql"
```

4. 可选：启动 Redis、MinIO

```bash
docker compose up -d
```

5. 初始化 Prisma

```bash
npm run prisma:generate
node server/prisma/seed.js
```

如果直接运行 seed 提示找不到 `DATABASE_URL`，请先设置环境变量，或确认根目录 `.env` 存在：

```powershell
$env:DATABASE_URL='mysql://root:123456@localhost:3306/love1'
node .\server\prisma\seed.js
```

6. 启动后端

```bash
npm run dev:server
```

后端默认地址：

```text
http://localhost:3000/api
```

7. 启动后台

```bash
npm run dev:admin
```

后台默认地址：

```text
http://localhost:5173
```

8. 启动前台 HTML 页面

```bash
npm run dev:web
```

前台默认地址：

```text
http://localhost:5174/you-and-me.html
```

## 已打通的接口

前台公开聚合接口：

```http
GET /api/public/spaces/default/bootstrap
```

后台接口：

```http
GET   /api/admin/spaces/default/dashboard
PATCH /api/admin/spaces/default/site-config
PATCH /api/admin/spaces/default/theme-config
PATCH /api/admin/spaces/default/profiles
GET   /api/admin/spaces/default/anniversaries
POST  /api/admin/spaces/default/anniversaries
GET   /api/admin/spaces/default/albums/items
GET   /api/admin/spaces/default/letters
GET   /api/admin/spaces/default/music/songs
POST  /api/admin/spaces/default/media/upload-url
POST  /api/admin/spaces/default/media/complete
DELETE /api/admin/spaces/default/albums/items/:id
POST  /api/admin/spaces/default/letters
DELETE /api/admin/spaces/default/letters/:id
POST  /api/admin/spaces/default/music/songs
DELETE /api/admin/spaces/default/music/songs/:id
```

## 对象存储

本地建议用 MinIO。控制台地址：

```text
http://localhost:9001
```

默认账号密码来自 `.env.example`：

```text
minioadmin / minioadmin
```

后台相册页的“上传到对象存储”会先调用后端签名接口，再用签名 URL 上传文件。

下一步应补：

- `media/complete` 入库接口。
- 上传后生成缩略图。
- 相册条目新增、排序、私密切换。

## 前台接入方式

当前 `you-and-me.html` 仍是静态页面。建议先在脚本区加入：

```js
async function loadSpace() {
  const res = await fetch('/api/public/spaces/default/bootstrap');
  const data = await res.json();
  console.log(data);
}

loadSpace();
```

然后逐步替换这些硬编码内容：

- 首页标题、简介、统计数据。
- 头像、昵称、称呼。
- 倒计时目标日期。
- 情书弹窗内容。
- 相册图片列表。
- 音乐列表。
- 主题颜色和背景图。

## 当前实现说明

`server/src/modules/content.service.ts` 已经使用 Prisma/MySQL 做真实数据库读写。第一次启动数据库后，请先创建 `love1` 数据库、执行 `server/prisma/mysql-init.sql` 建表，再运行 seed。seed 会创建默认空间、管理员账号、资料、主题、纪念日、相册、情书和音乐数据。

建议下一步优先做：

1. 后台登录鉴权。
2. 媒体上传完成入库与缩略图生成。
3. 前台 `you-and-me.html` 接入 bootstrap 数据。
4. 情书、音乐、相册条目的完整新增/编辑/删除接口。
