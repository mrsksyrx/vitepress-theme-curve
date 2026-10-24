<h1 align="center"> Curve </h1>
<p align="center">一个 VitePress 博客主题</p>
<p align="center">
  <img src="https://github.com/imsyy/vitepress-theme-curve/assets/42232682/bed62689-cfd8-4d98-b946-24555d4ce1fb" alt="curve-logo" />
</p>

---

预览本站: [sgexilq.com](https://sgexilq.com/)

本站基于以下开源项目二次开发：  
 [kazukokawagawa/vitepress-theme-curve](https://github.com/kazukokawagawa/vitepress-theme-curve)  
 [imsyy/vitepress-theme-curve](https://github.com/imsyy/vitepress-theme-curve)  
 本站的诞生离不开上游作者的开源贡献，在此感谢他(她)们。
 
> [!NOTE]
> 该主题本意为自用，所以可能并不能做到开箱即用，如果有此需求，建议优先使用上游项目。  
> 近期可能会新增一个单独的分支可用于直接使用，敬请期待。

# VitePress Theme Curve 项目更新笔记

## 相比上游仓库的主要更新

- **站点定制**：改为个人博客站点，重新配置标题、域名、Logo、导航、页脚、友链、项目入口和关于页面。
- **视觉样式**：加入粉蓝主题、动态背景、自定义光标、亚克力顶栏、更多主题色和高对比度模式。
- **移动端体验**：优化移动端导航、侧边栏、小组件面板、返回操作、手势和长文本显示。
- **消息与动画**：增加卡片消息、超级岛消息、阅读进度条、悬停效果和更多过渡动画。
- **个性化设置**：重构设置面板，支持配置导入导出、恢复默认、主题色、字体、布局、动画和组件开关。
- **文章功能**：增加字数统计、预估阅读时间、分享面板、文章点赞和「编辑此页」。
- **文章安全**：增强密码文章加密和客户端解锁能力。
- **搜索功能**：支持 Algolia，并在离线或接口失败时自动降级到本地搜索。
- **音乐播放器**：增强全局播放器，支持歌词、封面、播放顺序、随机播放、自动播放和更多播放源。
- **侧边栏挂件**：增强天气、倒计时、计时、日期、站点数据和 GitHub 热榜等挂件。
- **图片体验**：增加图片懒加载、骨架屏、图片灯箱和更稳定的图片加载处理。
- **离线能力**：增强 PWA 缓存，优化字体、图标和文章数据的离线使用。
- **内容与路由**：改进分类、标签和分页路由，使翻页和无 JavaScript 浏览更稳定。
- **日期与时间**：统一文章日期、归档、倒计时和 RSS 的时间处理，减少时区导致的日期错误。
- **性能优化**：减少首页文章数据请求失败时的空白，优化搜索面板、文章 GPT、图片加载和首屏初始化。
- **稳定性修复**：修复移动端布局、弹窗层级、动画卡顿、播放器异常、评论加载和页面切换等问题。
- **内存与生命周期**：完善组件卸载后的监听器、定时器和异步任务清理。
- **构建优化**：优化 sitemap、canonical、RSS、PWA 和构建期文章数据生成。
- **部署支持**：增强 Vercel、Cloudflare Pages 和 GitHub Actions 部署支持。
- **接口能力**：增加点赞和音乐代理接口，并保持 Vercel 与 Cloudflare 两端实现同步。
- **工具链**：改进 ESLint、TypeScript、Prettier 和包管理配置。
- **安全加固**：修复外链跳转、URL 编码、配置持久化和敏感信息处理方面的问题。
- **内容资源**：替换默认 Logo、图标和友链资源，增加本地字体和站点专属内容。
- **许可证**：将错误的 AGPL v3 许可修正为 MIT。

## 目录结构

```text
vitepress-theme-curve/
├── .vitepress/                # VitePress 配置和主题代码
│   ├── config.mjs             # 站点配置、构建钩子、sitemap、PWA 等
│   ├── init.mjs               # 加载并合并根目录 themeConfig.mjs
│   ├── theme/                 # 主题入口、布局和核心逻辑
│   │   ├── App.vue            # 自定义页面布局
│   │   ├── index.mjs          # 主题入口，注册 Pinia 和全局能力
│   │   ├── components/        # 导航、播放器、搜索、评论、挂件等组件
│   │   ├── views/             # 首页、文章页、归档、友链等页面视图
│   │   ├── store/             # Pinia 全局状态和持久化配置
│   │   ├── style/             # SCSS 全局样式
│   │   ├── utils/             # 文章、日期、搜索、RSS、加密等工具
│   │   └── assets/            # 主题默认配置和默认友链数据
├── posts/                     # 博客文章，文件路径对应 URL 路径
├── pages/                     # 独立页面、分类页和标签页
├── page/                      # 首页分页路由和跳转页面
├── public/                    # 静态资源，构建时原样复制到产物根目录
│   ├── fonts/                 # 本地字体资源
│   ├── images/                # Logo、图标、封面和友链图片
│   ├── data/                  # 构建期生成的文章数据和搜索索引
│   ├── redirect.html          # 外链跳转中转页
│   └── robots.txt             # 搜索引擎收录规则
├── api/                       # Vercel Serverless 接口
├── functions/api/             # Cloudflare Pages Functions 接口
├── themeConfig.mjs            # 当前站点的个性化主题配置
├── package.json               # 项目依赖和命令
├── pnpm-lock.yaml             # pnpm 锁文件
├── README.md                  # 项目说明
├── AGENTS.md                  # 开发和维护说明
└── .github/workflows/         # GitHub Actions 部署流程
```

其中：

- `.vitepress/theme/components/` 放可复用的 Vue 组件。
- `.vitepress/theme/views/` 放首页、文章页等大型页面视图。
- `.vitepress/theme/utils/` 放文章数据、日期、搜索、RSS、加密等纯逻辑工具。
- `public/data/postData.json` 和搜索索引由构建过程生成，不需要手工维护。
- `.vitepress/auto-imports.d.ts`、`.vitepress/components.d.ts` 等是自动生成文件。
- 修改站点配置时优先修改根目录 `themeConfig.mjs`，不要修改默认主题配置。

## Frontmatter 与 Markdown 语法

写文章时，在 `.md` 文件最顶部使用 `---` 包裹 Frontmatter：

```markdown
---
title: 示例文章
date: 2026-10-24
description: 这是文章摘要
categories: [开发]
tags: [VitePress, Vue]
---

正文内容……
```

### 常用 Frontmatter 字段

| 字段 | 说明 |
| --- | --- |
| `title` | 文章标题 |
| `date` | 发布日期，建议使用 `YYYY-MM-DD` |
| `description` | 文章摘要，用于列表和 RSS |
| `categories` | 分类，可以是字符串或数组 |
| `tags` | 标签，可以是字符串或数组 |
| `top` | 置顶权重，数字越大越靠前，`true` 表示置顶 |
| `cover` | 封面图片地址，需要开启封面显示功能后生效 |
| `articleGPT` | AI 摘要卡片内容 |
| `references` | 参考资料列表，每项包含标题和链接 |
| `password` | 文章密码，设置后正文会在构建时加密 |
| `comment` | 是否显示评论区，布尔值 |
| `copyright` | 是否显示版权声明，布尔值 |

例如：

```markdown
---
title: 一篇带封面的文章
date: 2026-10-24
description: 用于文章列表展示的摘要
categories: [前端]
tags: [VitePress, Vue]
top: 1
cover: /images/example.webp
articleGPT: 这篇文章介绍了主题的使用方法
password: 123456
comment: true
copyright: true
---
```

`tags` 和 `categories` 都支持两种写法：

```yaml
tags: [开发, 博客]
categories: 前端
```

### 基础 Markdown 语法

文章正文支持常见 Markdown 写法：

```markdown
# 一级标题

## 二级标题

**加粗文字**

*斜体文字*

~~删除线~~

`行内代码`

> 这是一段引用

- 无序列表
- 第二项

1. 有序列表
2. 第二项

[链接文字](https://example.com)

![图片说明](/images/example.png)

---

| 名称 | 说明 |
| --- | --- |
| 名称一 | 内容一 |
```

### 主题扩展语法

项目在普通 Markdown 之外，还加入了一些主题扩展能力。

#### 属性标记

支持为元素添加 class、id 和自定义属性：

```markdown
::: card
一个卡片内容
:::

::: card{.warning #my-card}
带样式属性的卡片
:::
```

#### 时间线

```markdown
::: timeline 时间线标题
这是时间线中的内容。
:::
```

#### 单选点样式

```markdown
::: radio
这是一个带状态标记的内容。
:::
```

#### 按钮样式

```markdown
::: button
这是一个按钮
:::
```

#### 卡片

```markdown
::: card
这是一张卡片，可以包裹任意 Markdown 内容。
:::
```

#### 提示块

支持 Obsidian 风格的 `ad-*` 提示块，例如：

````
```ad-note
这是一个提示块。
```

```ad-warning
这是一个警告块。
```

```ad-tip
这是一个技巧块。
```
````

### 图片和表格

- 图片会自动启用懒加载。
- 站内图片会尝试使用 WebP 版本。
- 开启 Fancybox 后，点击图片可以放大查看。
- 表格会自动包裹在可横向滚动的容器中，宽表格不会撑破页面。
- 图片可以放在普通 Markdown 链接中，主题会避免重复嵌套链接。

### 加密文章

如果 Frontmatter 中设置了 `password`：

- 构建时会自动加密正文；
- 页面默认显示“文章已加密”；
- 用户输入正确密码后才会解密显示；
- 正文中的脚本、样式和自定义块不会进入普通页面内容；
- 密码文章不仅适用于 `posts/`，其他页面设置密码后也会被加密。

### 写作建议

- 日期建议使用 `YYYY-MM-DD`，避免不同设备出现时区差异。
- 标签和分类建议使用数组写法，多个值更清晰。
- 封面图建议使用稳定的本地路径或可靠图床。
- 长表格建议控制列数，并合理使用标题层级。
- 复杂内容可以优先使用卡片、提示块、时间线等主题语法。

## 主题配置

主题配置分为两层：

- 默认配置：`.vitepress/theme/assets/themeConfig.mjs`
- 个人覆盖配置：项目根目录的 `themeConfig.mjs`

根目录配置会与默认配置进行深合并，因此只需要写需要修改的字段，其他字段会自动继承默认值。

```js
export const themeConfig = {
  siteMeta: {
    title: "我的博客",
    site: "https://example.com",
  },
};

export default themeConfig;
```

### 配置合并规则

- 普通对象会进行深层合并。
- `nav`、`navMore`、`footer.social`、`footer.sitemap` 等数组会整体替换默认数组。
- 例如写了新的 `nav`，就会覆盖默认导航，而不是在默认导航后面追加。
- 配置中没有写的字段会继续使用默认值。
- 不要修改 `.vitepress/theme/assets/themeConfig.mjs`，个人定制应写在根目录 `themeConfig.mjs` 中。

### 常用配置分组

| 配置项 | 用途 |
| --- | --- |
| `siteMeta` | 站点标题、描述、Logo、域名、语言和作者信息 |
| `nav` / `navMore` | 顶部导航和左上角更多菜单 |
| `cover` | 文章列表封面显示方式 |
| `footer` | 社交链接、页脚站点地图和底部信息 |
| `comment` | 评论系统开关，以及 Artalk / Twikoo 参数 |
| `aside` | 侧边栏组件开关和显示内容 |
| `friends` | 友情链接数据和动态友链 |
| `music` | 音乐播放器、歌单、平台和接口地址 |
| `search` | Algolia 搜索配置 |
| `fancybox` | 图片灯箱开关和资源地址 |
| `likeData` | 文章点赞功能开关 |
| `editLink` | 文章「编辑此页」链接 |
| `jumpRedirect` | 站外链接跳转提示页 |
| `rewardData` | 打赏功能配置 |
| `inject.header` | 追加到页面 `<head>` 的标签 |
| `since` | 网站建站年份或日期 |
| `icp` | 备案信息 |
| `postSize` | 首页每页文章数量 |

### 常见配置示例

```js
export const themeConfig = {
  comment: {
    enable: true,
    type: "twikoo",
  },

  music: {
    enable: true,
  },

  search: {
    enable: true,
  },

  fancybox: {
    enable: true,
  },

  likeData: {
    enable: true,
  },

  editLink: {
    enable: true,
    repo: "https://github.com/user/blog",
    branch: "main",
  },

  jumpRedirect: {
    enable: true,
  },

  postSize: 10,
};
```

### 环境变量

天气、热榜和状态挂件等服务可以通过 `.env` 配置：

```dotenv
VITE_WEATHER_KEY=
VITE_HELLOGITHUB_API_URL=
VITE_BETTER_STACK_STATUS_PAGE_URL=
```

注意：

- 所有 `VITE_` 开头的变量都会进入浏览器端产物，不能放置真正的服务端秘密。
- Better Stack 等服务端 Token 应配置在部署平台环境中。
- 修改环境变量后通常需要重启开发服务器或重新构建。

## 快速入门与部署

### 环境要求

- Node.js 20 或更高版本
- pnpm 10 或更高版本
- 建议使用 Git 管理项目版本

### 安装依赖

在项目根目录执行：

```bash
pnpm install
```

项目使用 `pnpm-lock.yaml` 作为唯一锁文件，不建议继续使用 npm 安装依赖。

### 本地开发

启动开发服务器：

```bash
pnpm dev
```

默认监听：

```text
http://localhost:9877
```

修改文章、页面或主题配置后，必要时需要重新构建或重启开发服务器，文章索引才会完全刷新。

### 构建静态站点

执行：

```bash
pnpm build
```

构建产物默认生成到：

```text
.vitepress/dist
```

构建过程中还会生成：

- `sitemap.xml`
- `rss.xml`
- PWA 相关资源
- 文章数据文件

### 预览构建结果

```bash
pnpm preview
```

### 格式化与检查

```bash
# Prettier 格式化
pnpm format

# ESLint 检查
pnpm lint

# ESLint 自动修复
pnpm lint:fix

# TypeScript 类型检查
npx tsc --noEmit
```

需要注意：

- 项目没有完整的自动化测试套件。
- 裸 `tsc` 不会检查 `.vue` 文件。
- `pnpm lint` 主要检查 JavaScript、TypeScript 和 Vue 文件。

### GitHub Pages 部署

项目包含 GitHub Actions 工作流，推送到指定分支后可以自动构建并部署到 GitHub Pages。

部署前需要确认：

- 仓库分支符合工作流配置；
- 工作流使用的 Node 和 pnpm 版本满足项目要求；
- GitHub Pages 已启用；
- 构建输出目录为 `.vitepress/dist`。

### Vercel 部署

可以使用项目中的 Vercel 配置进行部署：

```bash
pnpm build
pnpm deploy:vercel
```

Vercel 项目中需要配置相应的服务端环境变量，例如 Better Stack Token 或 Redis 相关配置。

### Cloudflare Pages 部署

Cloudflare Pages 可以使用：

- 构建命令：`pnpm build`
- 输出目录：`.vitepress/dist`
- Functions 目录：`functions/`

点赞、音乐和状态等接口需要根据 Cloudflare Pages Functions 的环境变量配置运行。

### 任意静态服务器

也可以直接将：

```text
.vitepress/dist
```

上传到任意静态服务器。

由于项目启用了 `cleanUrls`，服务器需要支持无扩展名 URL 自动回退到对应的 HTML 页面。

### 功能不可用时的降级

以下功能在没有配置后端或网络不可用时会自动降级：

- 点赞计数显示为 `-`
- 天气挂件不可用
- 搜索自动切换到本地或提示不可用
- 音乐接口请求失败时播放器显示异常状态
- PWA 离线数据可能不完整

这些降级情况通常不会影响站点构建和基础页面访问。

## 可用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装项目依赖 |
| `pnpm dev` | 启动本地开发服务器，默认端口为 9877 |
| `pnpm build` | 构建静态站点，输出到 `.vitepress/dist` |
| `pnpm preview` | 预览已经构建好的静态站点 |
| `pnpm format` | 使用 Prettier 格式化项目文件 |
| `pnpm lint` | 使用 ESLint 检查 JavaScript、TypeScript 和 Vue 文件 |
| `pnpm lint:fix` | 使用 ESLint 自动修复可修复的问题 |
| `pnpm deploy:vercel` | 通过 Vercel CLI 部署项目 |
| `npx tsc --noEmit` | 执行 TypeScript 类型检查，但不覆盖 `.vue` 文件 |

### 常用组合

第一次使用项目：

```bash
pnpm install
pnpm dev
```

提交代码前：

```bash
pnpm format
pnpm lint
pnpm build
```

检查 TypeScript：

```bash
npx tsc --noEmit
```

### 命令注意事项

- 项目应优先使用 `pnpm`，不建议使用 `npm install`。
- `pnpm build` 会重新生成部分构建数据文件，运行后 Git 状态可能出现变化。
- `pnpm lint` 不等于完整质量检查，项目目前没有覆盖所有 `.vue` 文件的类型检查。
- 项目没有独立的自动化测试命令。
- 构建产物只在 `.vitepress/dist` 中生成，运行 `pnpm build` 不会直接修改源码。

## 已知问题

- **类型检查覆盖不完整**：普通 `tsc` 不会解析 `.vue` 文件，因此目前没有覆盖所有 Vue 组件的完整类型检查。
- **没有完整测试套件**：项目没有统一的自动化测试命令，分页、日期和文章数据等逻辑主要依靠人工验证。
- **`.env` 仍可能被 Git 跟踪**：如果其中包含真实密钥，应先轮换凭据，再将其移出版本控制。
- **构建会生成数据文件**：运行 `pnpm dev` 或 `pnpm build` 时会更新文章数据和搜索索引等文件，Git 状态可能出现变化。
- **`public/` 是源目录**：其中的文件会原样复制到构建产物，不应放置需要手工维护的最终构建结果。
- **`robots.txt` 是静态文件**：它不会根据配置自动生成，需要修改 `public/robots.txt`。
- **跳转页和分页壳页面容易混淆**：部分页面只是跳转或分页入口，不应被搜索引擎当作主要内容收录。
- **外链中转依赖配置**：`jumpRedirect` 默认关闭，当前站点通过根目录配置启用；非 HTTP(S) 链接不会进入中转页。
- **部分资源依赖公共 CDN**：字体、图标、评论和图片灯箱等资源可能受到网络环境影响。
- **点赞和状态接口依赖后端环境**：未配置 Redis、Better Stack 或服务端 Token 时，相关功能会显示不可用或降级状态。
- **前端环境变量会公开**：所有 `VITE_` 变量都会进入浏览器端产物，不能用于保存真正的服务端秘密。
- **主题配置已经站点化**：根目录 `themeConfig.mjs` 包含当前站点的标题、域名、导航、友链和服务配置，不能直接作为通用模板使用。
- **上游仓库存在后续更新**：本地分支和上游仓库已经分叉，直接覆盖文件可能导致配置、路由或站点内容丢失。

## 来源声明

本项目的站点内容与主题改造基于**另一条独立的创作谱系**，其中包括对多位作者文章的**转载**（见 `posts/archives/`、`posts/2025/1229.md` 等，正文中标注了原作者），以及涉及个人经历、医疗与调查性质的原创写作。

- 站点文章版权归**各自作者**所有，不因收录在本仓库而改变。
- 若你是某篇文章的权利人并希望其被移除，请通过 [GitHub Issues](https://github.com/imsyy/vitepress-theme-curve/issues) 联系维护者。
- 代码部分以仓库根的 [MIT License](LICENSE) 授权，**该授权不适用于站点文章内容**。

## 致谢与许可

- 主题源自 [imsyy/vitepress-theme-curve](https://github.com/imsyy/vitepress-theme-curve)，感谢上游作者 [imsyy](https://imsyy.top) 的开源工作。
- 基于 [VitePress](https://vitepress.dev/zh/) 与 [Vue 3](https://vuejs.org/) 构建。
- 代码以 [MIT License](LICENSE) 授权。

<div align="center">

**Powered by VitePress**

</div>
