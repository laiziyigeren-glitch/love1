# 免费部署上线指南

这套部署方式使用：

- 前台：Cloudflare Pages
- 后台：admin 子域名，Cloudflare Pages
- 后端 API：Render Free Web Service
- 数据库：Aiven Free MySQL

建议域名规划：

```text
likeu.love            前台
www.likeu.love        前台
admin.likeu.love      后台
api.likeu.love        后端 API
```

## 1. 上传代码到 GitHub

1. 在 GitHub 新建一个仓库。
2. 把当前项目推送上去。
3. 确认仓库里有这些文件：

```text
render.yaml
config.example.js
scripts/build-web.js
docs/free-deploy.md
server/
admin/
you-and-me.html
爱心代码合集/
```

## 2. 创建 Aiven MySQL

1. 打开 Aiven，创建免费 MySQL。
2. 创建后复制连接信息。
3. 拼成 Prisma 使用的连接串：

```text
mysql://用户名:密码@主机:端口/defaultdb?ssl-mode=REQUIRED
```

注意：

- Aiven 通常要求 SSL，所以连接串建议带 `?ssl-mode=REQUIRED`。
- 数据库名通常是 `defaultdb`，以 Aiven 页面显示为准。

## 3. 部署 Render 后端

1. 打开 Render。
2. New -> Blueprint。
3. 选择你的 GitHub 仓库。
4. Render 会读取根目录的 `render.yaml`。
5. 创建服务时填写环境变量：

```text
DATABASE_URL=mysql://用户名:密码@主机:端口/defaultdb?ssl-mode=REQUIRED
CORS_ORIGINS=https://likeu.love,https://www.likeu.love,https://admin.likeu.love
ADMIN_EMAIL=admin@love.local
ADMIN_PASSWORD=换成一个强密码
```

6. 等待构建完成。
7. Render 会给你一个地址，例如：

```text
https://love1-api.onrender.com
```

8. 打开验证：

```text
https://love1-api.onrender.com/api/public/spaces/default/bootstrap
```

如果能看到 JSON，说明后端启动成功。

## 4. 初始化数据库

Render 第一次启动只会启动服务，不一定会自动建表和填默认数据。推荐本地执行一次：

```powershell
$env:DATABASE_URL='mysql://用户名:密码@主机:端口/defaultdb?ssl-mode=REQUIRED'
npm --workspace server run prisma:generate
cmd /c "mysql --ssl-mode=REQUIRED -h 主机 -P 端口 -u 用户名 -p defaultdb < server\prisma\mysql-init.sql"
npm --workspace server run prisma:seed
```

如果你本机没有 `mysql` 命令，可以用 Aiven 控制台的 Query Editor 执行 `server/prisma/mysql-init.sql`，再本地运行 seed。

## 5. 绑定 API 域名

在 Render 服务里添加 Custom Domain：

```text
api.likeu.love
```

Render 会提示你添加 DNS 记录。到 Cloudflare DNS 里照着添加。

绑定成功后验证：

```text
https://api.likeu.love/api/public/spaces/default/bootstrap
```

## 6. 部署前台到 Cloudflare Pages

1. Cloudflare Pages -> Create a project。
2. 连接 GitHub 仓库。
3. 选择项目。
4. 构建设置：

```text
Framework preset: None
Build command: npm install && npm run build:web
Build output directory: dist-web
Root directory: /
```

5. 部署前，Cloudflare Pages 需要有 `config.js`。当前 `build:web` 会把 `config.example.js` 复制成 `dist-web/config.js`。
6. 修改 `config.example.js`：

```js
window.LOVE1_API_BASE = 'https://api.likeu.love/api';
```

7. 重新提交到 GitHub，Cloudflare Pages 会自动重新部署。
8. 绑定自定义域名：

```text
likeu.love
www.likeu.love
```

9. 验证前台：

```text
https://likeu.love/you-and-me.html
```

## 7. 部署后台到 Cloudflare Pages

再创建一个 Cloudflare Pages 项目，仍然连接同一个 GitHub 仓库。

构建设置：

```text
Framework preset: Vue
Root directory: admin
Build command: npm install && npm run build
Build output directory: dist
```

环境变量：

```text
VITE_API_BASE=https://api.likeu.love
```

注意：这里不要在末尾加 `/api`，后台代码里的接口路径已经带 `/api`。

绑定自定义域名：

```text
admin.likeu.love
```

验证后台：

```text
https://admin.likeu.love
```

## 8. 检查 CORS

如果后台提示无法连接后端，检查 Render 的环境变量：

```text
CORS_ORIGINS=https://likeu.love,https://www.likeu.love,https://admin.likeu.love
```

修改后需要在 Render 手动重启服务。

## 9. 免费方案的限制

- Render 免费服务会休眠，第一次打开可能慢几十秒。
- 当前图片、视频、音乐、心动花园单文件 HTML 主要存进 MySQL，不适合大文件。
- Aiven 免费 MySQL 容量有限，图片建议压缩后再上传。
- 视频和 MP3 尽量少传或传小文件。

建议大小：

```text
图片：每张 1MB 内
视频：不建议上传大视频
音乐：尽量 5MB 内
心动花园 HTML：1MB 内
```

## 10. 上线后日常维护

- 改代码：推送 GitHub，Cloudflare/Render 自动部署。
- 改内容：进后台 `https://admin.likeu.love` 保存。
- Render 睡眠：第一次访问慢是正常的。
- 数据库备份：定期从 Aiven 导出备份。
