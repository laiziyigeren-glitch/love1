# 后台移动端适配修改建议

## 目标

在不影响 PC 端后台现有布局和操作习惯的前提下，为 `admin/` 后台管理端增加手机和平板窄屏适配。第一阶段只做布局和交互层面的响应式优化，不改 API、不改数据库、不改部署配置。

## 当前判断

后台是 Vue 3 + Vite + Element Plus，核心文件集中在：

- `admin/src/App.vue`
- `admin/src/styles.css`
- `admin/src/api.ts`

目前后台布局更偏桌面端：

- 左侧 `el-aside.sidebar` 固定 232px。
- 顶部 `topbar` 横向展示标题和按钮。
- 主内容 `main` 有 24px padding。
- 多数编辑区使用 `el-table`，列较多，手机上容易横向溢出。
- `inline-actions`、`upload-actions` 已经在 1100px 以下改成单列，但整体导航、表格、弹窗还没有完整移动端策略。

## 改造原则

1. PC 端不动默认样式。
   所有移动端样式放在 `@media (max-width: 768px)` 或更窄的媒体查询里。

2. 优先 CSS 适配，少改结构。
   只在确实需要移动端菜单开关时再改 `App.vue`。

3. 表格优先保证可操作。
   第一阶段不重写所有 `el-table` 为卡片，先使用横向滚动和固定操作列，避免大改。

4. 手机端以“偶尔管理”为目标。
   后台不是高频移动办公 SaaS，先保证能登录、能切换模块、能编辑保存、能上传小文件、不会横向撑爆页面。

5. 不新增依赖。
   Element Plus 已经足够，不引入新的 UI 库或手势库。

## 第一阶段建议

### 1. 后台整体布局

目标：

- 手机端隐藏固定侧边栏。
- 顶部保留页面标题和操作按钮。
- 增加一个移动端菜单按钮，用抽屉或下拉菜单展示后台模块。

建议实现：

- 在 `App.vue` 里增加 `mobileMenuOpen` 状态。
- 顶部 `topbar` 左侧增加一个“菜单”按钮，仅移动端显示。
- 移动端使用 Element Plus `el-drawer` 承载同一组菜单项。
- PC 端继续使用原来的 `el-aside.sidebar`。

建议 CSS：

```css
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .shell {
    display: block;
  }

  .topbar {
    height: auto;
    min-height: 64px;
    padding: 12px 14px;
    align-items: flex-start;
    gap: 12px;
  }

  .topbar h1 {
    font-size: 18px;
  }

  .topbar p {
    font-size: 12px;
    line-height: 1.5;
  }
}
```

### 2. 主内容留白和卡片

目标：

- 手机端减少左右 padding。
- 卡片不要贴边，也不要保持桌面端过宽留白。
- 页面不出现全局横向滚动。

建议：

```css
@media (max-width: 768px) {
  .main {
    padding: 12px;
  }

  .el-card {
    border-radius: 8px;
  }

  body {
    overflow-x: hidden;
  }
}
```

### 3. 顶部按钮区

目标：

- “刷新数据”“退出登录”等按钮在手机上可换行。
- 按钮触控高度不小于 40px。

建议：

```css
@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
  }

  .topbar-actions {
    width: 100%;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .topbar-actions .el-button {
    min-height: 40px;
  }
}
```

### 4. 表单布局

目标：

- `el-form` 的 label 在手机上改为顶部显示。
- 输入框、日期选择器、上传按钮全部占满可用宽度。
- 多控件行在手机上自动垂直堆叠。

建议：

```css
@media (max-width: 768px) {
  .el-form-item {
    display: block;
  }

  .el-form-item__label {
    display: block;
    width: auto !important;
    text-align: left;
    margin-bottom: 6px;
  }

  .el-form-item__content {
    margin-left: 0 !important;
    display: block;
  }

  .el-input,
  .el-select,
  .el-date-editor,
  .el-input-number,
  .el-textarea {
    width: 100% !important;
  }

  .inline-actions,
  .upload-actions,
  .song-upload-actions {
    grid-template-columns: 1fr !important;
    display: grid;
    width: 100%;
  }
}
```

### 5. 表格处理

目标：

- 手机端不强行把所有管理表格重写成卡片。
- 先保证表格能横向滚动、输入框能编辑、操作按钮能点到。

建议：

```css
@media (max-width: 768px) {
  .el-table {
    width: 100%;
  }

  .el-table__body-wrapper,
  .el-table__header-wrapper {
    overflow-x: auto;
  }

  .el-table .el-input,
  .el-table .el-select,
  .el-table .el-date-editor {
    min-width: 140px;
  }
}
```

后续第二阶段再考虑将高频表格改成移动端卡片，例如：

- 首页甜蜜时刻
- 未来约定
- 纪念日重要时刻
- 今日小语
- 音乐管理
- 心动花园项目管理

### 6. 弹窗和抽屉

目标：

- 编辑媒体信息、预览、上传相关弹窗在手机上不超出屏幕。
- 底部按钮始终能看见。

建议：

```css
@media (max-width: 768px) {
  .el-dialog {
    width: calc(100vw - 24px) !important;
    margin: 12px auto !important;
  }

  .el-dialog__body {
    max-height: calc(100vh - 170px);
    overflow-y: auto;
  }
}
```

### 7. 登录页

目标：

- 手机端登录卡片居中。
- 卡片宽度不要超过屏幕。
- 输入框和按钮适合手指点击。

建议：

```css
@media (max-width: 768px) {
  .login-shell {
    padding: 16px;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
  }

  .login-button {
    width: 100%;
    min-height: 42px;
  }
}
```

## 建议实施顺序

1. 先做全局移动端外壳：
   `sidebar` 隐藏、`topbar` 换行、`main` 缩小 padding。

2. 再做表单和按钮：
   `el-form-item` label 顶部显示，所有输入控件宽度 100%。

3. 再做表格保底：
   表格横向滚动、输入框最小宽度、操作按钮可点击。

4. 最后做移动端菜单：
   加 `el-drawer` 或移动端顶部菜单，不影响 PC 端侧边栏。

5. 观察使用频率后，再决定是否把重点表格改成卡片式移动端编辑。

## 验证范围

本地验证建议：

```bash
npm --workspace admin run build
```

如果实际改了后台界面，还建议本地启动：

```bash
npm --workspace admin run dev
```

检查宽度：

- 390 x 844 手机
- 430 x 932 大屏手机
- 768 x 1024 平板窄屏
- 1440 x 900 PC

重点检查：

- 登录页能正常输入和提交。
- 手机端能打开菜单并切换所有模块。
- 首页、资料、纪念日、相册、情书、音乐、心动花园、主题、隐私提醒都没有全局横向溢出。
- 表格可以横向滚动，保存和删除按钮可点击。
- 上传按钮、日期选择器、开关、输入框在手机上能正常操作。
- PC 端侧边栏、顶部栏、表格密度保持原样。

## 部署影响

预计不需要修改：

- Render 环境变量
- Render build/start 命令
- Cloudflare Pages 环境变量
- Cloudflare Pages build 设置
- DNS / custom domain
- R2 配置

只要改动范围限定在 `admin/src/App.vue` 和 `admin/src/styles.css`，部署侧通常不需要人工调整。

## 第一阶段验收标准

- 手机端 `admin.likeu.love` 可以完成基础管理操作。
- PC 端后台视觉和布局无明显变化。
- `npm --workspace admin run build` 通过。
- 没有新增依赖。
- 没有改动后端 API、数据库和部署配置。
