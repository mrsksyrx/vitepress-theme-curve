# VitePress Theme Curve Template

这是一个可以复制后直接开始使用的 VitePress 博客模板。它保留了原有主题的页面、导航、侧边栏、文章列表、分类、标签、归档、RSS、PWA 等功能，示例内容只是为了帮助你理解每个文件该放什么。

即使你没有使用过 Node.js、Git 或 VitePress，也可以按照本页从零完成本地预览和第一次发布。

---

## 一、你会得到什么

复制模板后，你会得到一个已经可以运行的博客：

- 首页文章列表与分页
- 文章详情页
- 分类页、标签页和归档页
- 关于作者、关于本站、友情链接、留言板等页面
- 明暗主题、字体、侧边栏、音乐播放器、搜索、评论等主题功能
- RSS、sitemap、PWA 和 GitHub Pages 部署工作流

模板已经把个人名称、域名、邮箱和服务地址替换成占位内容。正式使用前，把占位内容换成你自己的信息即可。

---

## 二、零基础准备

### 1. 安装 Node.js

前往 [Node.js 官网](https://nodejs.org/) 下载并安装 **LTS 版本**。安装时保持默认选项即可。

安装完成后，打开终端检查版本：

```bash
node -v
```

建议输出为 `v20` 或更高版本。

### 2. 启用 pnpm

安装 Node.js 后，在终端执行：

```bash
corepack enable
corepack prepare pnpm@10 --activate
```

检查 pnpm：

```bash
pnpm -v
```

建议输出为 `10.x` 或更高版本。

Windows 用户可以使用 PowerShell 或 Windows Terminal；macOS 用户使用“终端”。

### 3. 获取项目

如果使用 GitHub：

1. 打开模板仓库页面。
2. 点击右上角 **Use this template**。
3. 选择 **Create a new repository**。
4. 填写仓库名称并创建。

如果不使用 GitHub，也可以直接下载 ZIP，解压到一个全英文路径，例如：

```text
D:\projects\my-blog
```

避免把项目放在包含特殊字符或过长路径的目录中。

---

## 三、第一次运行

在终端进入项目目录：

```powershell
cd D:\projects\my-blog
```

macOS / Linux：

```bash
cd ~/projects/my-blog
```

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

看到类似输出后，打开浏览器访问：

```text
http://localhost:9877
```

如果端口被占用，可以使用：

```bash
pnpm dev -- --port 9878
```

停止服务器：在终端按 `Ctrl + C`。

开发模式会自动刷新页面。修改 Markdown 或配置后，切回浏览器即可看到效果。

---

## 四、第一次修改

### 1. 修改站点名称

打开根目录的 [`themeConfig.mjs`](./themeConfig.mjs)。先修改下面几项：

```js
siteMeta: {
  title: "My Blog",
  description: "记录我的学习与生活",
  site: "https://example.com",
  author: {
    name: "Your Name",
    email: "hello@example.com",
    link: "https://example.com",
  },
},
```

同时搜索并替换仓库中的占位内容：

- `My Curve Blog`
- `Your Name`
- `hello@example.com`
- `example.com`
- `your-name`
- `your-repository`

建议使用编辑器的“全部替换”功能，但替换前先确认匹配范围。

### 2. 写第一篇文章

打开：

```text
posts/2026/0907.md
```

这是一篇示例文章。复制一份并改成自己的文件名也是可以的，例如：

```text
posts/2026/1025.md
```

文章开头是 frontmatter：

```yaml
---
title: 我的第一篇文章
date: 2026-10-25
categories: [日常]
tags: [记录, 开始]
description: 这是我发布的第一篇文章。
top: true
cover: /images/blog/first-post/cover.webp
---
```

字段说明：

| 字段          | 是否必需 | 作用                         |
| ------------- | -------- | ---------------------------- |
| `title`       | 是       | 文章标题                     |
| `date`        | 是       | 发布日期，会影响归档和排序   |
| `categories`  | 建议填写 | 文章分类，可以写字符串或数组 |
| `tags`        | 建议填写 | 文章标签，可以写字符串或数组 |
| `description` | 建议填写 | 列表摘要和 SEO 描述          |
| `top`         | 可选     | `true` 表示置顶              |
| `cover`       | 可选     | 文章封面图片地址             |
| `articleGPT`  | 可选     | 主题中的文章摘要文案         |

frontmatter 结束后，正文直接使用 Markdown 写作。

### 3. 添加图片

图片建议放在 `public/` 下：

```text
public/images/blog/first-post/cover.webp
```

在文章中这样引用：

```md
![文章封面](/images/blog/first-post/cover.webp)
```

注意：

- 路径以 `/images/...` 开头，表示网站根目录。
- 文件名建议使用小写字母、数字和短横线。
- 图片提交到 Git 前先压缩，避免仓库和网页加载过慢。

### 4. 修改普通页面

页面位于 `pages/` 目录。例如：

```text
pages/about-me.md
pages/about-website.md
pages/link.md
pages/privacy.md
```

页面文件的路径会成为网址。修改 Markdown 内容即可，不需要修改 Vue 组件，除非你要改变页面布局。

---

## 五、目录结构

```text
.
├─ posts/                    # 文章
├─ pages/                    # 关于、友链、分类、标签等页面
├─ page/                     # 首页分页和跳转壳
├─ public/                   # 图片、字体、favicon、robots.txt
├─ themeConfig.mjs           # 站点配置，只需要改这里
├─ .vitepress/
│  ├─ config.mjs             # VitePress、RSS、PWA 构建配置
│  └─ theme/                 # 主题组件、样式和工具
├─ api/                      # Vercel 服务端示例
└─ functions/                # Cloudflare Pages 服务端示例
```

不要手工维护 `public/data/postData.json`。它会在开发或构建时自动生成，并且已经被 `.gitignore` 忽略。

---

## 六、主题配置

所有站点配置都集中在根目录的 `themeConfig.mjs`。主题会把它与 `.vitepress/theme/assets/themeConfig.mjs` 中的默认配置合并。

### 导航栏

当前导航结构为：

- `文库`：文章列表、全部分类、全部标签
- `友链`：友情链接、畅所欲言
- `我的`：关于作者、关于本站、回到主页、服务状态

如果你要增加一个页面：

1. 在 `pages/` 中创建 Markdown 文件。
2. 在 `themeConfig.mjs` 的 `nav` 中增加对应菜单项。
3. 运行 `pnpm dev` 检查导航。

### 数组字段

`nav`、`navMore`、`inject.header`、`footer.social`、`footer.sitemap`、`aside.timing.items` 等数组字段会整体替换默认值，不会把新旧数组拼接。修改时不要漏掉需要保留的项目。

---

## 七、常用命令

| 命令                 | 用途                               |
| -------------------- | ---------------------------------- |
| `pnpm dev`           | 本地开发预览                       |
| `pnpm build`         | 构建静态网站到 `.vitepress/dist`   |
| `pnpm preview`       | 本地预览构建产物                   |
| `pnpm format`        | 格式化项目文件                     |
| `pnpm lint`          | 检查 JavaScript、Vue 和 TypeScript |
| `pnpm lint:fix`      | 自动修复部分代码问题               |
| `pnpm deploy:vercel` | 使用 Vercel CLI 部署               |

正式发布前至少执行：

```bash
pnpm format
pnpm lint
pnpm build
```

---

## 八、启用可选功能

### 评论

在 `themeConfig.mjs` 中找到：

```js
comment: {
  enable: true,
  type: "twikoo",
  twikoo: {
    envId: "你的 Twikoo 环境地址",
  },
},
```

也可以选择 Artalk。具体字段以你使用的服务文档为准。

### 搜索

搜索使用 Algolia：

```js
search: {
  enable: true,
  appId: "你的 Algolia App ID",
  apiKey: "你的 search-only API Key",
  index: "你的索引名称",
},
```

`apiKey` 应该使用只能搜索的公开 Key，不要使用管理员 Key。

### 天气

复制环境变量示例：

```powershell
Copy-Item .env.example .env.local
```

然后填写：

```text
VITE_WEATHER_KEY=你的高德天气 Key
```

再开启 `aside.weather`。所有 `VITE_` 变量都会进入浏览器产物，只能保存可公开的值。

### 音乐

配置 `music.url`、`music.id`、`music.server` 和 `music.type` 后开启 `music`。不要把需要保密的 API Token 放进前端配置。

---

## 九、发布到 GitHub Pages

项目包含 `.github/workflows/deploy.yml`。它默认在 `master` 分支推送时构建并部署 `.vitepress/dist`。

步骤：

1. 在 GitHub 仓库中进入 **Settings → Pages**。
2. 在 **Build and deployment** 中选择 **GitHub Actions**。
3. 确认工作流中的分支与你的默认分支一致。
4. 提交并推送代码。
5. 在 Actions 页面等待部署完成。

如果当前项目使用 `release` 分支，把工作流中的：

```yaml
branches: [master]
```

改成：

```yaml
branches: [release]
```

---

## 十、发布到 Vercel

项目包含 `vercel.json`。可以使用：

```bash
pnpm deploy:vercel
```

也可以在 Vercel 控制台导入仓库，使用以下设置：

- Framework：VitePress / Other
- Build command：`pnpm build`
- Output directory：`.vitepress/dist`

服务端 Token 放在 Vercel 的 Environment Variables 中，不要写入 `.env.local`。

---

## 十一、常见问题

### `pnpm` 不是可用命令

确认已经安装 Node.js，并执行：

```bash
corepack enable
corepack prepare pnpm@10 --activate
```

### 页面没有更新

确认 `pnpm dev` 仍在运行，并检查浏览器控制台是否有语法错误。Markdown 的 frontmatter 必须以 `---` 开始并以 `---` 结束。

### 图片不显示

确认图片在 `public/` 下，并且引用路径以 `/` 开头。例如：

```md
![封面](/images/blog/cover.webp)
```

### 构建后出现空白页面

先执行：

```bash
pnpm build
```

如果构建失败，从第一条错误开始处理，不要只看最后一条警告。

### 评论、搜索或天气不可用

这些功能需要第三方服务。检查对应的 URL、Key、索引名称和环境变量是否填写正确。

---

## 十二、发布前检查

- [ ] 站点标题、描述、域名、作者和邮箱已修改
- [ ] Logo、favicon 和封面图片已替换
- [ ] 示例文章已经修改或删除
- [ ] 关于、友链、隐私和版权页面已经确认
- [ ] 评论、搜索、音乐等第三方功能已配置或关闭
- [ ] `pnpm build` 构建成功
- [ ] 桌面端和移动端导航都能正常使用
- [ ] `sitemap.xml`、`rss.xml`、`robots.txt` 内容正确
- [ ] 仓库中没有真实密钥、私人邮箱或不必要的个人信息

---

## 十三、许可与致谢

代码基于 [MIT License](./LICENSE)。主题源自 [imsyy/vitepress-theme-curve](https://github.com/imsyy/vitepress-theme-curve)，感谢上游作者与所有贡献者。

> Powered by VitePress
