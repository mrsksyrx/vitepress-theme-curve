# 模板初始化清单

这份清单适合第一次建立博客的人。你可以按顺序完成，不需要一开始就理解所有主题代码。每完成一项就勾选一项，最后用本地预览和构建命令确认网站正常。

---

## 第一阶段：先让网站跑起来

### 1. 确认开发环境

- [ ] 安装 Node.js 20 或更高版本。
- [ ] 打开终端，执行 `node -v`，确认能看到版本号。
- [ ] 执行 `corepack enable`。
- [ ] 执行 `corepack prepare pnpm@10 --activate`。
- [ ] 执行 `pnpm -v`，确认 pnpm 可用。

如果使用 Windows，推荐使用 PowerShell 或 Windows Terminal。不要把项目放在网盘同步目录、压缩包内部或包含特殊字符的路径中。

### 2. 获取并启动模板

- [ ] 使用 GitHub 的 **Use this template** 创建仓库，或下载 ZIP 解压。
- [ ] 在终端进入项目目录。
- [ ] 执行 `pnpm install`。
- [ ] 执行 `pnpm dev`。
- [ ] 打开 `http://localhost:9877`，确认能看到首页。

如果端口被占用：

```bash
pnpm dev -- --port 9878
```

此时访问 `http://localhost:9878`。

---

## 第二阶段：替换站点身份

打开根目录的 [`themeConfig.mjs`](./themeConfig.mjs)。

### 1. 站点信息

- [ ] `siteMeta.title`：改成博客名称。
- [ ] `siteMeta.description`：改成一句简短介绍。
- [ ] `siteMeta.site`：改成正式域名；暂时没有域名时先使用 `https://example.com`。
- [ ] `siteMeta.author.name`：改成作者名称。
- [ ] `siteMeta.author.email`：改成联系邮箱。
- [ ] `siteMeta.author.link`：改成作者主页或博客地址。
- [ ] `since`：改成建站日期。
- [ ] `icp`：没有备案信息就保留空字符串。

### 2. 全局替换占位内容

在编辑器中搜索并替换：

- `My Curve Blog`
- `Your Name`
- `hello@example.com`
- `example.com`
- `your-name`
- `your-repository`
- `YOUR_ALGOLIA_APP_ID`
- `YOUR_SEARCH_ONLY_API_KEY`
- `your_index_pages`

不要盲目替换代码中的英文单词，只替换明确的占位字符串和链接。

### 3. 仓库信息

- [ ] 修改 [`package.json`](./package.json) 中的 `name`、`author`、`repository`、`home`、`github` 和 `blog`。
- [ ] 修改设置面板中的源码链接和反馈链接，或者将它们替换成你的仓库地址。
- [ ] 确认 `.github/workflows/deploy.yml` 中的分支与你的默认分支一致。

---

## 第三阶段：替换品牌资源

- [ ] 用自己的 Logo 覆盖 `public/images/logo/logo.svg`。
- [ ] 用自己的图片替换 `public/images/logo/favicon-32.png`。
- [ ] 用自己的图片替换 `public/images/logo/favicon-96.png`。
- [ ] 用自己的图片替换 `public/images/logo/favicon-256.png`。
- [ ] 用自己的图片替换 `public/images/logo/favicon-512.png`。
- [ ] 检查 `public/favicon.ico`。
- [ ] 修改 `public/robots.txt` 中的站点地址。
- [ ] 修改 `public/redirect.html` 中的站点名称、主页链接和域名白名单。
- [ ] 删除或替换 `public/images/friend/` 中的示例头像。

图片建议使用 WebP 或 PNG。文件名使用小写字母、数字、短横线，避免空格和中文。

---

## 第四阶段：写第一篇文章

### 1. 理解文章位置

文章放在 `posts/` 目录，文件路径就是文章网址。

例如：

```text
posts/2026/1025.md
```

会生成类似：

```text
/posts/2026/1025
```

### 2. 修改示例文章

- [ ] 修改 `posts/2026/0907.md`。
- [ ] 修改或删除 `posts/2026/0917.md`。
- [ ] 删除不需要的示例分类和标签。

### 3. 推荐的文章开头

```yaml
---
title: 我的第一篇文章
date: 2026-10-25
categories: [日常]
tags: [记录, 开始]
description: 这是我发布的第一篇文章，用来测试博客模板。
top: true
cover: /images/blog/first-post/cover.webp
articleGPT: 这篇文章介绍我为什么开始写博客，以及我准备记录哪些内容。
---
```

### 4. 文章正文建议

一篇容易阅读的文章通常包括：

1. 这篇文章解决什么问题。
2. 读者需要提前准备什么。
3. 按步骤展开正文。
4. 总结关键结论。
5. 给出下一步或参考链接。

不要只写一两句话。即使主题样式很好，文章内容才是网站的核心。

---

## 第五阶段：完善页面

### 1. 关于页面

- [ ] 修改 `pages/about-me.md`。
- [ ] 修改 `.vitepress/theme/views/AboutMe.vue` 中的作者介绍。
- [ ] 修改 `pages/about-website.md`。
- [ ] 修改 `.vitepress/theme/views/AboutWebsite.vue` 中的站点介绍。

如果暂时不想修改 Vue 组件，可以先只替换组件中的文字和链接，保持布局不变。

### 2. 友链页面

- [ ] 修改 `pages/link.md`。
- [ ] 修改 `.vitepress/theme/assets/linkData.mjs`。
- [ ] 填写自己的友链名称、头像、简介和网址。
- [ ] 修改 `pages/link.md` 中的申请规则。

### 3. 法律与说明页面

- [ ] 修改 `pages/privacy.md`，说明实际使用的统计、评论、搜索、天气和部署服务。
- [ ] 修改 `pages/cc.md`，选择适合你的文章和代码许可。
- [ ] 修改 `pages/hide/message.md`。
- [ ] 修改 `pages/todo.md`，或者删除该页面。

---

## 第六阶段：配置主题功能

在 `themeConfig.mjs` 中找到对应功能。第一次使用时，可以先只修改站点信息，等基础页面完成后再逐项启用。

### 评论

- [ ] 决定使用 Artalk 还是 Twikoo。
- [ ] 填写 `comment` 中的服务地址。
- [ ] 在本地打开留言板，确认评论框可以加载。
- [ ] 发布一篇测试评论，再删除测试数据。

### 搜索

- [ ] 注册 Algolia。
- [ ] 创建索引。
- [ ] 填写 `search.appId`。
- [ ] 填写 search-only `search.apiKey`。
- [ ] 填写 `search.index`。
- [ ] 在首页搜索自己的文章标题。

### 音乐

- [ ] 准备 Meting API 地址。
- [ ] 填写 `music.url`。
- [ ] 填写歌单或歌曲 ID。
- [ ] 确认 `music.server` 和 `music.type`。
- [ ] 测试播放器可以加载。

### 天气

- [ ] 复制 `.env.example` 为 `.env.local`。
- [ ] 填写可公开的 `VITE_WEATHER_KEY`。
- [ ] 开启 `aside.weather`。
- [ ] 测试天气组件。

### 其他功能

- [ ] 配置 `rewardData`。
- [ ] 配置 `tongji["51la"]`。
- [ ] 检查 `jumpRedirect` 是否需要开启。
- [ ] 检查 PWA 图标和名称。

---

## 第七阶段：服务端与环境变量

### 可以进入浏览器的变量

这些变量可以写入 `.env.local`：

```text
VITE_WEATHER_KEY=
VITE_HELLOGITHUB_API_URL=
VITE_BETTER_STACK_STATUS_PAGE_URL=
```

所有 `VITE_` 变量最终都会进入网页文件，不能放管理员 Token 或数据库密码。

### 只能放在部署平台的变量

例如：

```text
BETTER_STACK_API_TOKEN=
```

这个变量应该放在 Vercel 或 Cloudflare Pages 的环境变量设置中，不要写入 `.env.local`。

- [ ] 阅读 `.env.example`。
- [ ] 创建自己的 `.env.local`。
- [ ] 确认 `.env.local` 不会被 Git 提交。
- [ ] 确认仓库历史中没有真实密钥。

---

## 第八阶段：部署

### GitHub Pages

- [ ] 打开 GitHub 仓库的 Settings。
- [ ] 打开 Pages。
- [ ] 选择 GitHub Actions。
- [ ] 确认 `.github/workflows/deploy.yml` 中的分支正确。
- [ ] 推送代码。
- [ ] 在 Actions 页面等待构建完成。
- [ ] 打开生成的 GitHub Pages 地址。

### Vercel

- [ ] 在 Vercel 导入仓库。
- [ ] Build command 填写 `pnpm build`。
- [ ] Output directory 填写 `.vitepress/dist`。
- [ ] 在 Vercel 环境变量中配置服务端 Token。
- [ ] 部署后测试首页、文章和 RSS。

---

## 第九阶段：发布前验证

```powershell
pnpm format
pnpm lint
pnpm build
pnpm preview
```

- [ ] 首页可以打开。
- [ ] 文章可以打开。
- [ ] 分类和标签页面正常。
- [ ] 归档页面正常。
- [ ] 关于页面正常。
- [ ] 友链页面正常。
- [ ] 留言板正常，或者明确显示评论服务未配置。
- [ ] 手机端导航和侧边栏正常。
- [ ] 明暗主题切换正常。
- [ ] 图片、字体和 Logo 正常加载。
- [ ] `rss.xml`、`sitemap.xml`、`robots.txt` 内容正确。
- [ ] 页面标题和描述没有残留模板占位内容。
- [ ] 仓库中没有真实邮箱、私人链接或密钥。

---

## 如果完全不会使用终端

可以按下面的方式练习：

1. 打开 PowerShell 或终端。
2. 使用 `cd` 进入项目目录。
3. 输入 `pnpm install` 并回车。
4. 输入 `pnpm dev` 并回车。
5. 按 `Ctrl + C` 停止运行。

在 Windows 中，如果你不知道项目路径，可以在文件资源管理器地址栏输入 `powershell`，然后回车，终端会自动进入当前目录。

---

## 如果构建失败

1. 先看第一条 `error`，不要只看最后的 warning。
2. 检查 Markdown 的 `---` 是否成对。
3. 检查 YAML 中的冒号、引号和缩进。
4. 检查图片路径是否真实存在。
5. 检查 `themeConfig.mjs` 中的括号、逗号和引号。
6. 执行 `pnpm format` 后再执行 `pnpm build`。

常见错误：

| 现象            | 可能原因                                  |
| --------------- | ----------------------------------------- |
| `pnpm` 不是命令 | Node.js 或 pnpm 没有安装                  |
| 页面 404        | 文件路径、导航链接或大小写不一致          |
| 图片不显示      | 图片不在 `public/`，或引用路径缺少 `/`    |
| 文章列表为空    | frontmatter 格式错误，或文章日期/路径异常 |
| 评论加载失败    | 评论服务地址、Token 或域名配置错误        |
| 搜索没有结果    | Algolia App ID、API Key 或索引名称错误    |

---

## 最后

模板只是起点。先让网站稳定运行，再逐步添加功能。不要一次修改太多内容；每完成一组修改就执行一次 `pnpm dev` 或 `pnpm build`，这样出现问题时更容易定位。
