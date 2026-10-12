<h1 align="center"> Curve </h1>
<p align="center">A Simple VitePress Theme</p>
<p align="center">
  <img src="https://github.com/imsyy/vitepress-theme-curve/assets/42232682/bed62689-cfd8-4d98-b946-24555d4ce1fb" alt="curve-logo" />
</p>

---

> [!TIP]
> 近期将通过 Nuxt 重构本项目前后端，敬请期待

Preview: 👻 [無名小栈](https://blog.imsyy.top/)

Docs: 📖 [主题文档](https://blog.imsyy.top/pages/categories/%E4%B8%BB%E9%A2%98%E6%96%87%E6%A1%A3)

> [!NOTE]
> 该主题本意为自用，所以部分配置可能并不完善，包括评论系统的支持，目前仅支持 Artalk，如有其他需求，可提交 pr

## Hello

🎉 你好啊，很高兴你选择了 [vitepress-theme-curve](https://github.com/imsyy/vitepress-theme-curve)，你可以查看 [主题文档](https://blog.imsyy.top/pages/categories/%E4%B8%BB%E9%A2%98%E6%96%87%E6%A1%A3) 以了解更多，如果你在使用本主题时遇到问题，你可以在 [GitHub](https://github.com/imsyy/vitepress-theme-curve) 中正确的提交 [issues](https://github.com/imsyy/vitepress-theme-curve/issues) 以获取社区的帮助。

## 快速开始

若您有修改主题的需求，请确保您拥有基础的前端知识，最好能掌握 [Vue.js](https://vuejs.org/) 框架的相关知识，并确保阅读了 `VitePress` 的 [官方文档](https://vitepress.dev/zh/guide/what-is-vitepress)

### 书写新的文章

你可以直接在站点根目录中的 `posts` 文件夹中直接新建 `markdown` 文件来书写，您的文件路径即为实际生成的网址路径。

### 添加新的页面

你可以直接在站点根目录中的 `pages` 文件夹中直接新建 `markdown` 文件来实现新建页面，您的文件路径即为实际生成的网址路径。

主题中已经内置了几个常用页面以供参考。

### 主题配置

本主题提供了一个 `themeConfig.mjs` 文件用来配置，它位于 `.vitepress\theme\assets\themeConfig.mjs`，你可以将它复制一份并移动至根目录中，在这里里面的修改将会覆盖初始配置，请注意，**请不要更改文件名或者删除原配置文件，否则它将会不起作用！**

### 静态文件

通常情况下，静态文件处于根目录下的 `public` 文件夹中，通常用于存放字体或图片等文件信息。

了解更多：[资源处理](https://vitepress.dev/zh/guide/asset-handling#asset-handling)

### 部署

如果你之前使用过类似于 [Hexo](https://hexo.io/zh-cn/) 一样的静态站点生成器的话，那么这二者是极为相似的，都是构建为静态文件后上传至服务器以实现访问，当然，你也可以借助 GitHub 的 Actions 以实现自动部署，具体细节请参考我的博客，此处不再细说。

```bash
# 安装依赖
npm run install
# 构建
npm run build
```

建议使用 `pnpm`，若未安装，可使用 `npm install pnpm -g` 来安装。

```bash
pnpm install
pnpm build
```

通常在未修改配置文件的情况下，打包后的文件会处于根目录下的 `.vitepress\dist` 目录中，您可以将其中的文件上传至任意服务器以访问。

## 更多

更多信息请参考：[主题文档](https://blog.imsyy.top/pages/categories/%E4%B8%BB%E9%A2%98%E6%96%87%E6%A1%A3)

> Powered by VitePress

[![Netlify Status](https://api.netlify.com/api/v1/badges/31ebe949-6ce7-46b7-a5fb-a73da20412d6/deploy-status)](https://app.netlify.com/sites/imsyy-blog/deploys)

| 命令                 | 说明                                                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`           | 启动开发服务器（`vitepress dev --host`）                                            |
| `pnpm build`         | 构建静态站点（产出 `sitemap.xml`、`rss.xml` 与 PWA 资源）                           |
| `pnpm preview`       | 预览构建产物                                                                        |
| `pnpm lint`          | ESLint 检查并自动修复（`.js/.jsx/.cjs/.mjs/.vue`，**不含点目录**）                  |
| `pnpm format`        | Prettier 格式化当前目录（`.prettierignore` 已排除 `dist`、锁文件与生成的 `*.d.ts`） |
| `pnpm deploy:vercel` | 通过 Vercel CLI 部署                                                                |
| `npx tsc --noEmit`   | TypeScript 类型检查（**不覆盖 `.vue`**，见下）                                      |

## 已知问题

这些问题在仓库中**真实存在**，在此如实记录，避免使用者踩坑：

- **质量链覆盖不全**：裸 `tsc` 不解析 `.vue` 单文件组件，实际参与类型检查的只有 2 个 `.ts` 与 2 个生成的 `.d.ts`，57 个 `.vue` 全部未被覆盖（完整覆盖需要 `vue-tsc`，本项目未安装也没有 `typecheck` 脚本）。ESLint 现已覆盖 `.vitepress/`（`pnpm lint` 显式传入），但 `.ts` 仍不在 `--ext` 列表中，`api/`、`functions/` 的 `.ts` 仍漏。
- **仓库没有测试套件**：`package.json` 中没有 test 脚本，也没有任何单测框架；`timeTools`、`getPostData`、分页数学等纯函数建议后续补齐单元测试。
- **密钥仍在版本控制中**：`.env` 至今仍被 Git 跟踪，其内容与 `HEAD` 完全一致，且 `.gitignore` **没有**忽略它（见下方[安全提示](#安全提示)）。
- **`.eslintignore` 残留**：其中仍列有已删除的临时目录（`_fix2`、`_fix3`、`.dsh_baseline`、`_fix_t1`、`_t4_*`）等历史条目。
- **跳转壳的重复内容**：`page.md`、`page/index.md`、`page/1.md`、`pages/index.md` 内容逐字节相同。`gray-matter` 以文件内容为键缓存解析结果，相同内容的文件会共享同一个 `head` 数组，历史上曾导致 canonical 标签跨页累积。构建配置现已在 `transformPageData` 中按页重建 `head`（替换引用、不就地 `push`，并保留 frontmatter 里用户自定义的 head 项，仅剔除 canonical 后补本页那条），但**共享 `head` 数组的根因仍在**，日后若在 `transformPageData` 里就地 `push` 新的 head 字段，同类问题会复现。
- **构建期会写入工作区**：加载 `.vitepress/config.mjs` 时会重新生成 `public/data/postData.json`，因此运行 `dev`/`build` 后 `git status` 必然出现该文件的变动。该文件**未被跟踪且已被 `.gitignore` 忽略**，不会污染提交。
- **`jumpRedirect` 默认关闭、本站已启用**：相关实现与 `/redirect.html` 已就位，主题默认 `jumpRedirect.enable: false`，但根目录 `themeConfig.mjs` 覆盖为 `true`。代码层缺陷（`text()` 丢嵌套元素、缺同源检查、非 http(s) 协议被包进中转页、Base64 非 UTF-8 对称）已修复。
- **`public/` 会被原样拷进产物**：`public/` 是**源目录**，其中的文件在构建时被逐份拷贝到 `.vitepress/dist` 根下（`postData.json` 就是这么进去的），因此不要在里面放需要手工维护的产物——下一次构建会用同名的源文件覆盖它。
- **`robots.txt` 是静态文件**：`public/robots.txt` 会被原样拷贝到产物根目录，**不是**构建期生成；修改收录规则请直接改该文件。
- **`themeConfig.mjs` 被 Git 跟踪**：根目录的覆盖文件**已被提交**（`git ls-files themeConfig.mjs` 可复现）；修改会出现在 `git status` 中。
- **`package-lock.json` 已删除**：该文件是上游 npm 残留，已移除并加入 `.gitignore`，请以 `pnpm-lock.yaml` 为准。
- **第三方 CDN 依赖**：iconfont、Fancybox、Twikoo 等资源默认走公共 CDN，网络受限环境下相关样式或功能可能不可用。

## 安全提示

- **`.env` 仍在版本控制中**：该文件已被提交，内容与 `HEAD` 一致，且 `.gitignore` 未忽略它（`git ls-files .env` 可复现）。处理顺序应当是：**先吊销/轮换其中所有凭据**，再把它移出跟踪（`git rm --cached .env` 并补进 `.gitignore`），最后按需用 `git filter-repo` 重写历史——顺序颠倒会让旧密钥在历史中继续有效。注意 `git rm --cached .env` **并不会**清掉仓库里其它位置的同一凭据。
- **同一个高德 Key 还有第二处明文**：除了 `.env:1`，`.vitepress/theme/assets/themeConfig.mjs` 的 `weatherkey` 注释块里也留了一份明文（`git grep -n "1d65cc630df1f212e1d2e928643e3974"` 可复现两处）。该字段已废弃（天气挂件现在读 `import.meta.env.VITE_WEATHER_KEY`），但注释里的明文会随仓库公开。轮换 Key 时两处都要处理，且因为 `VITE_` 变量会被打包进前端产物、天气请求由**访客浏览器**直连 `restapi.amap.com`，这个 Key 本质上是公开的、无法用域名/IP 白名单保护——实际风险是**当日 5000 次配额被烧掉导致天气挂件失效**，不涉及账户接管。
- 站点内含个人化配置与统计、评论等服务凭据，公开部署前请逐项检查 `themeConfig.mjs`、`.env` 与 `api/`、`functions/` 下的环境变量读取。
- 所有 `VITE_` 前缀的变量都会被**打包进前端产物**，对其调用方可见，只应放可公开的值；`BETTER_STACK_API_TOKEN` 只在服务端使用，切勿加 `VITE_` 前缀或写入前端代码。

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
