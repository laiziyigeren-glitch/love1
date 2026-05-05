# 心动花园资源、代码编辑区与音乐歌词展示建议

## 结论

你提的“后台心动花园多一个代码编辑区，一个小项目就是一个小文件夹”的方向是可行的，而且比单纯上传一个 HTML 更适合长期维护。

现在可以保留两种方式：

- 旧方式：直接上传单个 HTML，适合很小的浪漫页面。
- 新方式：代码编辑区，一个项目一个文件夹，可以新建 HTML/CSS/JS 文件，也可以上传图片、视频、音乐等项目素材。

需要提前说明一点：上线后不能直接引用你电脑本地文件，例如 `C:\Users\...` 或 `file:///C:/...`。这些路径只有你自己的电脑能看到，网站上线后浏览器访问不到。要用本地电脑里的照片、视频、音乐，必须先上传到项目文件夹或网站对象存储。

## 心动花园推荐形态

### 1. 保留单 HTML 上传

这个不用动，之前上传的项目继续可用。

适合：

- 只有一个 HTML 文件的小页面。
- 不依赖本地图片、音乐、视频。
- 或者所有资源都已经写成完整 URL。

示例：

```html
<img src="https://media.likeu.love/default/图片/相册/默认相册/example.jpg" />
<audio src="https://media.likeu.love/default/音乐/歌曲/小幸运/example.mp3" controls></audio>
```

### 2. 新增代码编辑区

这是建议新增的重点功能。

后台心动花园里，每个项目可以进入“代码编辑区”，里面像一个小项目文件夹：

```text
心动花园/
  项目/
    粒子爱心/
      index.html
      style.css
      main.js
      images/
        heart.png
        background.jpg
      audio/
        bgm.mp3
      video/
        intro.mp4
```

后台可以支持：

- 新建项目文件夹。
- 新建文件，比如 `index.html`、`style.css`、`main.js`。
- 上传项目素材，比如图片、音乐、视频。
- 设置入口文件，默认是 `index.html`。
- 在线编辑 HTML/CSS/JS。
- 保存后前台心动花园直接预览。
- 老的“上传 HTML”按钮继续保留。

这样 HTML 里就可以写：

```html
<link rel="stylesheet" href="./style.css" />
<img src="./images/heart.png" />
<audio src="./audio/bgm.mp3" controls></audio>
<script src="./main.js"></script>
```

### 3. 站内素材选择器

建议代码编辑区里同时加一个“插入站内素材”功能。

可以从这些地方选：

- 相册图片
- 相册视频
- 音乐页面里的歌曲
- 已上传的心动花园素材

选择后自动生成代码片段：

```html
<img src="选中的图片URL" />
```

```html
<video src="选中的视频URL" controls playsinline></video>
```

```html
<audio src="选中的音乐URL" controls></audio>
```

这样你不用去 R2 里面复制地址，也不需要记路径。

## 本地电脑素材怎么用

可以用，但必须先上传。

不能这样写：

```html
<img src="C:\Users\wangbiao\Desktop\a.jpg" />
<audio src="file:///C:/Users/wangbiao/Desktop/bgm.mp3"></audio>
```

原因：

- 这些是你电脑上的本地路径。
- 网站部署到 Cloudflare Pages 后，访问者的浏览器看不到这些文件。
- 手机访问时也不可能读取你电脑桌面的文件。

正确方式：

1. 在代码编辑区上传 `a.jpg`。
2. 它会进入当前心动花园项目的素材目录。
3. 后台返回可以引用的路径或 URL。
4. HTML 里使用项目相对路径或公开 URL。

例如：

```html
<img src="./images/a.jpg" />
```

或者：

```html
<img src="https://media.likeu.love/default/心动花园/项目/粒子爱心/images/a.jpg" />
```

## 对象存储分类建议

整体保持四个大项，不要全部塞到图片目录下：

```text
图片/
视频/
音乐/
心动花园/
```

心动花园下面再细分：

```text
心动花园/
  项目/
    粒子爱心/
      index.html
      style.css
      main.js
      images/
      audio/
      video/
  封面/
    粒子爱心/
      cover.jpg
  素材/
    公共素材/
```

如果某个心动花园项目引用的是网站已有相册或音乐，不需要复制一份到心动花园目录。数据库只记录引用 URL 即可，避免重复占空间。

## 后台数据结构建议

心动花园项目现有字段可以保留：

```ts
type HeartGardenProject = {
  id: string;
  title: string;
  type: 'html';
  group: 'particle' | 'confession' | 'custom';
  tag: string;
  icon: string;
  description: string;
  url: string;
  cover: string;
  status: 'ready' | 'pending';
  content?: string;
};
```

建议新增：

```ts
type HeartGardenFile = {
  id: string;
  path: string;
  type: 'html' | 'css' | 'js' | 'image' | 'audio' | 'video' | 'other';
  content?: string;
  url?: string;
  objectKey?: string;
  size?: number;
};
```

项目里增加：

```ts
files: HeartGardenFile[];
entryFile: string;
linkedAssets: Array<{
  id: string;
  sourceType: 'album' | 'song' | 'video';
  sourceId: string;
  url: string;
}>;
```

说明：

- HTML/CSS/JS 这种文本文件可以保存 `content`。
- 图片、视频、音乐这类二进制文件放 R2，数据库只保存 `url` 和 `objectKey`。
- `entryFile` 用来告诉前台打开哪个文件，默认 `index.html`。
- `linkedAssets` 用来记录这个项目引用过哪些站内资源。

第一版可以先存在 `site.settings.heartGarden.projects` 的 JSON 配置里，不一定立刻新建 Prisma 表。等功能稳定后，再考虑把项目文件单独建表。

## 前台预览建议

当前心动花园已经有 iframe 预览，可以继续沿用。

新代码编辑区上线后，预览规则建议：

1. 如果项目有 `entryFile`，优先打开入口文件。
2. 如果项目只有旧的 `url`，继续打开旧 URL。
3. 如果项目只有单 HTML `content`，继续用 Blob 预览。
4. 如果入口文件缺失，显示友好提示。

对于项目文件夹里的相对路径，有两种实现方式：

### 方式 A：保存 HTML 时替换相对路径

把：

```html
<img src="./images/a.jpg">
```

替换成：

```html
<img src="https://media.likeu.love/default/心动花园/项目/xxx/images/a.jpg">
```

优点是 iframe 预览简单。

缺点是保存逻辑更复杂。

### 方式 B：每个文件都上传到 R2 对应路径

让 `index.html`、`style.css`、`main.js` 和素材都在同一个 R2 项目目录下，保留相对路径。

优点是更接近真实小项目。

缺点是编辑和保存时要管理多个文件。

我的建议：先做方式 A，后面再升级方式 B。

## 不做 ZIP 整包上传解压

心动花园后续不做 ZIP 整包上传解压。

原因：

- ZIP 解压和路径重写复杂度比较高。
- 不同项目的目录结构不统一，容易出现预览失败。
- 中文路径、嵌套文件夹、外部脚本、字体和音乐路径都容易出问题。
- 现在更适合把能力集中在“代码编辑区 + 项目素材上传 + 站内素材引用”上。

所以后续心动花园只保留这些方式：

- 直接上传单个 HTML。
- 在代码编辑区新建和编辑 HTML/CSS/JS 文件。
- 给当前项目上传图片、视频、音乐等素材。
- 从站内相册、视频、音乐选择已有素材并插入引用。

这样更稳定，也更符合你现在的实际使用方式。

## 音乐歌词滚动建议

### 当前情况

现在歌曲里已经有 `lyric` 字段，但更像“歌词片段”，不是按播放时间滚动的歌词。

如果要做歌词滚动，建议支持 LRC：

```text
[00:12.30]原来你是我最想留住的幸运
[00:18.20]原来我们和爱情曾经靠得那么近
[00:25.00]那为我对抗世界的决定
```

### 后台怎么加

歌曲编辑里增加：

- 歌词格式：普通文本 / LRC 时间轴
- 歌词内容 textarea
- 可选上传 `.lrc` 或 `.txt`

推荐字段：

```ts
lyricsText: string;
lyricsFormat: 'plain' | 'lrc';
```

如果暂时不想改数据库，可以先复用当前 `lyric` 字段。但长期看，正式滚动歌词最好单独加字段。

### 前台歌词放哪里

音乐页现在已经比较完整，不建议把布局打散。

桌面端：

- 直接使用现在“歌词片段”这张卡片的位置。
- 把“歌词片段”改成“歌词展示”。
- 不再保留原来的歌词片段逻辑。
- 当前行高亮并自动滚动。
- 卡片内容区域显示多行歌词，播放时自动滚动到当前歌词。

移动端：

- 同样使用原“歌词片段”卡片位置。
- 如果空间不够，可以默认显示当前歌词附近 3 到 5 行。
- 点击卡片后再展开完整歌词抽屉。
- 不遮挡底部导航和播放按钮。

最终音乐页里的这个卡片建议从：

```text
歌词片段
愿你所到之处，遍地都是小幸运。
— 小幸运 · 田馥甄
```

改成：

```text
歌词展示
上一句歌词
当前歌词高亮
下一句歌词
```

没有歌词时显示：

```text
这首歌还没有填写歌词。
```

## 推荐实施顺序

### 第一阶段：心动花园站内素材选择器

目标：HTML 能方便引用网站已有照片、视频、音乐。

做：

- 后台心动花园增加“插入站内素材”。
- 支持生成 `<img>`、`<video>`、`<audio>` 代码片段。
- 项目记录引用过的素材。

部署影响：

- 需要重新部署前台和后台。
- 一般不需要新增环境变量。
- 一般不需要改 Cloudflare Pages 构建命令。

### 第二阶段：心动花园代码编辑区

目标：每个心动花园项目都能像小文件夹一样编辑。

做：

- 新建文件。
- 编辑 HTML。
- 上传项目素材。
- 设置入口文件。
- 保留旧的 HTML 上传方式。

部署影响：

- 需要改前台、后台、后端。
- 如果文件信息先存在 settings JSON，可以暂时不做数据库迁移。
- 如果要做独立项目文件表，需要 Prisma migration。
- 不需要新增 Render 环境变量。

### 第三阶段：项目素材相对路径处理

目标：HTML 里写 `./images/a.jpg` 也能正常预览。

做：

- 上传素材时按项目目录保存。
- 保存 HTML 时替换或解析相对路径。
- 前台预览使用处理后的入口文件。

部署影响：

- 需要重新部署前台、后台、后端。
- 不需要改 DNS。
- 不需要改 R2 CORS，除非新增了新的访问域名。

### 第四阶段：音乐歌词滚动

目标：后台上传歌词，前台播放时滚动展示。

做：

- 后台歌曲增加歌词编辑。
- 前台解析 LRC。
- 把当前“歌词片段”卡片改成“歌词展示”卡片。
- 桌面端在这张卡片里滚动歌词。
- 移动端优先在这张卡片里展示当前歌词附近几行，必要时点击展开歌词抽屉。

部署影响：

- 如果复用 `lyric` 字段，不需要数据库迁移。
- 如果新增 `lyricsText`、`lyricsFormat`，需要 Prisma migration。

## 我的建议

你的“代码编辑区”想法可以做，而且方向很好。它会让心动花园从“HTML 展示列表”升级成“浪漫小项目工作台”。

但实施顺序建议不要一口吃太大：

1. 先做站内素材选择器，让 HTML 可以快速引用已有图片、视频、音乐。
2. 再做代码编辑区，一个项目一个文件夹。
3. 再做相对路径处理。

这样风险小，也不会影响之前已经能打开的心动花园项目。

ZIP 整包上传解压先不做，后续也不作为当前计划的一部分。

## 本次文档更新的部署说明

只更新这个建议文档，不需要修改 Render、Cloudflare Pages、R2、TiDB 或 DNS。

如果后面开始开发代码编辑区，我会在每次提交前告诉你是否需要：

- 改 Render 环境变量。
- 改 Cloudflare Pages 环境变量。
- 改 Cloudflare Pages 构建命令。
- 改 R2 CORS。
- 跑 Prisma migration。
