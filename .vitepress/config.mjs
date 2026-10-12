import { defineConfig } from "vitepress";
import { createRssFile } from "./theme/utils/generateRSS.mjs";
import { withPwa } from "@vite-pwa/vitepress";
import { getAllPosts } from "./theme/utils/getPostData.mjs";
import { jumpRedirect } from "./theme/utils/commonTools.mjs";
import { getThemeConfig } from "./init.mjs";
import markdownConfig from "./theme/utils/markdownConfig.mjs";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 构建时注入的 Git 短哈希，页脚点击标题可查看
let gitCommit = "unknown";
try {
  gitCommit = execSync("git rev-parse --short HEAD").toString().trim();
} catch {}

// 获取全局数据
const postData = await getAllPosts();
await fs.outputJson("public/data/postData.json", postData);

// 获取主题配置
const themeConfig = await getThemeConfig();

// 固定跳转页（meta refresh → 首页）的 URL 集合，用于从 sitemap 中剔除。
// 这些都是 page.md / page/index.md / page/1.md / pages/index.md 生成的跳转壳；
// /page/2..N 是 page/[num].paths.mjs 生成的真实分页内容页，**不在此列**。
//
// 注意：VitePress 的 `transformItems` 传进来的 `item.url` 是**完整 URL**
// （如 "https://chiyu.it/page"），而 sitemap.xml 里的 <loc> 也是完整 URL。
// 因此归一化必须**先剥掉 origin**，只比较路径，否则路径与完整 URL 永不相等。
const normalizeSitemapUrl = (url) => {
  let pathname = String(url || "");
  // 优先用 URL API 取 pathname；非绝对 URL（纯路径）时回退为字符串处理
  try {
    pathname = new URL(pathname).pathname;
  } catch {
    pathname = pathname.replace(/^https?:\/\/[^/]+/i, "");
  }
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};
const REDIRECT_PAGE_URLS = new Set(["/page", "/page/1", "/pages"].map(normalizeSitemapUrl));

// 确定性兜底：从产物 sitemap.xml 中按 <loc> 路径剔除跳转壳。
// 幂等——若 URL 已不存在则原样返回。防 VitePress 版本行为变化。
const removeRedirectPagesFromSitemap = (outDir) => {
  const sitemapPath = path.join(outDir, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return;
  const source = fs.readFileSync(sitemapPath, "utf-8");
  const removed = [];
  const filtered = source.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const loc = block.match(/<loc>(.*?)<\/loc>/);
    if (!loc) return block;
    if (!REDIRECT_PAGE_URLS.has(normalizeSitemapUrl(loc[1]))) return block;
    removed.push(loc[1]);
    return "";
  });
  if (removed.length === 0) return;
  fs.writeFileSync(sitemapPath, filtered, "utf-8");
  console.log(`[sitemap] 已从 sitemap 剔除 ${removed.length} 个跳转页: ${removed.join(", ")}`);
};

// https://vitepress.dev/reference/site-config
export default withPwa(
  defineConfig({
    title: themeConfig.siteMeta.title,
    description: themeConfig.siteMeta.description,
    lang: themeConfig.siteMeta.lang,
    // 简洁的 URL
    cleanUrls: true,
    base: "/",
    // 最后更新时间戳
    lastUpdated: true,
    // 主题
    appearance: "dark",
    // Head
    head: [
      ...themeConfig.inject.header,
      [
        "noscript",
        {},
        `<style>
          body > .loading {
            display: none !important;
          }
          .main-layout {
            display: block !important;
          }
        </style>`,
      ],
    ],
    // sitemap
    sitemap: {
      hostname: themeConfig.siteMeta.site,
      // 跳转壳不进 sitemap：收录它们只会让搜索引擎看到重复/无效入口。
      transformItems: (items) =>
        items.filter((item) => !REDIRECT_PAGE_URLS.has(normalizeSitemapUrl(item.url))),
    },
    // 主题配置
    themeConfig: {
      ...themeConfig,
      postCount: postData.length,
    },
    // markdown
    markdown: {
      math: true,
      lineNumbers: true,
      toc: { level: [1, 2, 3] },
      image: {
        lazyLoading: true,
      },
      config: (md) => markdownConfig(md, themeConfig),
    },
    // 构建排除
    // 下划线前缀的 md 一律视为仓库内部文件（审计 / 分析等临时产物），
    // 绝不发布到站点：它们既会生成页面，也会被 sitemap 收录。
    srcExclude: ["**/README.md", "**/TODO.md", "_*.md", "**/_*.md", "AGENTS.md", "agent"],
    // transformPageData
    transformPageData: async (pageData) => {
      // canonical URL
      const siteRoot = themeConfig.siteMeta.site.replace(/\/+$/, "");
      const canonicalUrl = `${siteRoot}/${pageData.relativePath}`
        .replace(/index\.md$/, "")
        .replace(/\.md$/, "");
      // ⚠️ 这里不能 `head.push(...)`：
      // gray-matter 以「文件内容字符串」为键缓存解析结果，内容完全相同的多个 .md
      // 会**共享同一个 head 数组**（实测 `matter(same).data.head === matter(same).data.head`
      // 为 true）。`frontmatterPlugin` 虽给每页新建了 frontmatter 外壳，但 `head`
      // 属性仍指向同一共享数组——就地 `push` 会跨页累积（实测 1→2→3→4 条 canonical）。
      // 触发过：page.md / page/index.md / page/1.md / pages/index.md（4 个文件逐字节全同）。
      //
      // 修法（两条约束，不丢用户项）：
      // 1. **绝不就地修改 `pageData.frontmatter.head`**，只用新数组替换本页引用；
      // 2. 重建时**保留 frontmatter 里用户自定义的全部 head 项**（og:image、自定义
      //    meta/link/script 等），仅剔除 canonical 后补上本页自己的那一条——
      //    canonical 必须唯一且指向本页，用户手写的或共享数组里残留的都不该留下。
      //
      // （曾用「白名单只留 meta refresh」的写法，会静默丢掉主题使用者写在
      //   frontmatter.head 里的任何自定义项；共享数组问题其实只需上面两条约束。）
      const existingHead = Array.isArray(pageData.frontmatter.head)
        ? pageData.frontmatter.head.filter(
            ([tag, attrs]) => !(tag === "link" && attrs?.rel === "canonical"),
          )
        : [];
      pageData.frontmatter.head = [
        ...existingHead,
        ["link", { rel: "canonical", href: canonicalUrl }],
      ];
    },
    // transformHtml
    transformHtml: (html) => {
      // VitePress 1.6.4 emits an empty vp-icons.css preload for custom themes.
      const withoutEmptyIconPreload = html.replace(
        /\s*<link rel="preload stylesheet" href="\/vp-icons\.css" as="style">/,
        "",
      );
      return jumpRedirect(withoutEmptyIconPreload, themeConfig);
    },
    // buildEnd
    buildEnd: async (config) => {
      await createRssFile(config, themeConfig);
      // 兜底：产物层再确定性地过滤一次跳转壳。
      // 主路径是上面的 sitemap.transformItems；此处用于防止 VitePress 版本行为变化
      // 导致剔除失效。幂等——已剔除时不做任何事。
      removeRedirectPagesFromSitemap(config.outDir);
    },
    // vite
    vite: {
      define: {
        __GIT_COMMIT__: JSON.stringify(gitCommit),
      },
      plugins: [
        AutoImport({
          imports: ["vue", "vitepress"],
          dts: ".vitepress/auto-imports.d.ts",
        }),
        Components({
          dirs: [".vitepress/theme/components", ".vitepress/theme/views"],
          extensions: ["vue", "md"],
          include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
          dts: ".vitepress/components.d.ts",
        }),
        {
          name: "theme-config-api",
          configureServer(server) {
            server.middlewares.use("/api/theme-config", (req, res) => {
              if (req.method !== "POST") {
                res.statusCode = 405;
                res.end("Method Not Allowed");
                return;
              }
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", () => {
                try {
                  const data = JSON.parse(body);
                  // 输入格式白名单：只允许已注册 validator 的键，不合规直接 400。
                  // 新增写入字段必须在此注册白名单 validator，禁止跳过校验直接拼接进文件。
                  const validators = {
                    siteVersion: (v) => /^V?\d+(\.\d+)*$/.test(v),
                    siteVersionDate: (v) =>
                      /^\d{4}\.\d{1,2}\.\d{1,2}(\s\d{1,2}:\d{2}:\d{2})?$/.test(v),
                    branchBuildTime: (v) =>
                      /^\d{4}\.\d{1,2}\.\d{1,2}(\s\d{1,2}:\d{2}:\d{2})?$/.test(v),
                    branchVersion: (v) => /^\d+$/.test(v),
                    DEFAULT_DEV_MODE: (v) => /^\d+$/.test(v),
                    resetVersion: (v) => /^\d+$/.test(v),
                    bumpVersion: (v) => typeof v === "boolean",
                  };
                  for (const key of Object.keys(data)) {
                    const validate = validators[key];
                    if (!validate) {
                      res.statusCode = 400;
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify({ ok: false, error: `未知字段 ${key}` }));
                      return;
                    }
                    if (!validate(data[key])) {
                      res.statusCode = 400;
                      res.setHeader("Content-Type", "application/json");
                      res.end(JSON.stringify({ ok: false, error: `字段 ${key} 格式不合法` }));
                      return;
                    }
                  }
                  const storePath = path.resolve(__dirname, "./theme/store/index.js");
                  let content = fs.readFileSync(storePath, "utf-8");
                  // 函数式替换：返回值不再解释 $ 等特殊字符
                  if (data.siteVersion != null) {
                    content = content.replace(
                      /(siteVersion:\s*")[^"]*(")/,
                      (_m, p1, p2) => `${p1}${data.siteVersion}${p2}`,
                    );
                  }
                  if (data.siteVersionDate != null) {
                    content = content.replace(
                      /(siteVersionDate:\s*")[^"]*(")/,
                      (_m, p1, p2) => `${p1}${data.siteVersionDate}${p2}`,
                    );
                  }
                  if (data.branchVersion != null) {
                    content = content.replace(
                      /(branchVersion:\s*)\d+/,
                      (_m, p1) => `${p1}${data.branchVersion}`,
                    );
                  }
                  if (data.branchBuildTime != null) {
                    content = content.replace(
                      /(branchBuildTime:\s*")[^"]*(")/,
                      (_m, p1, p2) => `${p1}${data.branchBuildTime}${p2}`,
                    );
                  }
                  if (data.DEFAULT_DEV_MODE != null) {
                    content = content.replace(
                      /(DEFAULT_DEV_MODE\s*=\s*)\d+/,
                      (_m, p1) => `${p1}${data.DEFAULT_DEV_MODE}`,
                    );
                  }
                  if (data.resetVersion) {
                    content = content.replace(
                      /(PERSIST_VERSION\s*=\s*)\d+/,
                      (_m, p1) => `${p1}${data.resetVersion}`,
                    );
                  } else if (data.bumpVersion) {
                    content = content.replace(
                      /(PERSIST_VERSION\s*=\s*)(\d+)/,
                      (_, prefix, num) => `${prefix}${parseInt(num) + 1}`,
                    );
                  }
                  fs.writeFileSync(storePath, content, "utf-8");
                  res.setHeader("Content-Type", "application/json");
                  res.end(JSON.stringify({ ok: true }));
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ ok: false, error: e.message }));
                }
              });
            });
          },
        },
        {
          // 本地 dev 没有 Vercel/CF Functions，补一个与 api/music-url.ts 同口径的解析端点
          name: "music-url-api",
          configureServer(server) {
            server.middlewares.use("/api/music-url", async (req, res) => {
              if (req.method !== "GET") {
                res.statusCode = 405;
                res.end("Method Not Allowed");
                return;
              }
              const reqUrl = new URL(req.url || "", "http://localhost");
              const raw = reqUrl.searchParams.get("url") || "";
              const ALLOWED_HOSTS = new Set([
                "meting.20091010.xyz",
                "meting.20100907.xyz",
                "music.163.com",
              ]);
              const ALLOWED_SUFFIXES = [".music.126.net", ".music.163.com"];
              const isAllowedUrl = (value) => {
                try {
                  const u = new URL(value);
                  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
                  const host = u.hostname.toLowerCase();
                  return ALLOWED_HOSTS.has(host) || ALLOWED_SUFFIXES.some((s) => host.endsWith(s))
                    ? u
                    : null;
                } catch {
                  return null;
                }
              };
              res.setHeader("Content-Type", "application/json");
              if (!raw) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "missing url" }));
                return;
              }
              try {
                let current = isAllowedUrl(raw);
                if (!current) throw new Error("URL not allowed");
                for (let i = 0; i < 5; i++) {
                  const hop = await fetch(current.toString(), {
                    method: "GET",
                    redirect: "manual",
                    signal: AbortSignal.timeout(5000),
                    headers: { "User-Agent": "Mozilla/5.0" },
                  });
                  if (hop.status >= 300 && hop.status < 400) {
                    const loc = hop.headers.get("location");
                    if (!loc) break;
                    const next = isAllowedUrl(new URL(loc, current).toString());
                    if (!next) throw new Error("redirect target not allowed");
                    current = next;
                    continue;
                  }
                  break;
                }
                const url = current.toString().replace(/^http:\/\//i, "https://");
                res.end(JSON.stringify({ url }));
              } catch (e) {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: e.message || "resolve failed" }));
              }
            });
          },
        },
      ],
      resolve: {
        // 配置路径别名
        alias: {
          // eslint-disable-next-line no-undef
          "@": path.resolve(__dirname, "./theme"),
        },
      },
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ["legacy-js-api"],
          },
        },
      },
      // 服务器
      server: {
        port: 9877,
      },
      // 构建
      build: {
        minify: "terser",
        terserOptions: {
          compress: {
            pure_funcs: ["console.log"],
          },
        },
      },
    },
    // PWA
    pwa: {
      registerType: "autoUpdate",

      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // 运行时缓存策略
        runtimeCaching: [
          // API 请求 - 网络优先（仅同源；跨域 Meting 等不得被拦截，
          // 其 pathname 也是 /api/，且 type=url 为 302 跳转链，进 SW 会 no-response）
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 分钟
              },
            },
          },
          // 文章页面 - 网络优先，离线回退缓存
          // cleanUrls 模式下永不命中（URL 不带 .html 后缀），保留供 cleanUrls 关闭时使用
          /*
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.html$/i.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
          */
          // VitePress 生成的页面路由（cleanUrls 模式，排除根级带点文件）
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin &&
              /^\/[^/]+\/?$/.test(url.pathname) &&
              !/\.(?:js|mjs|css|map|json|txt|xml|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf|webmanifest)$/i.test(
                url.pathname,
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "page-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
          // 文章详情页路由（排除静态资源后缀）
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin &&
              /^\/[^/]+\/.+/.test(url.pathname) &&
              !/\.(?:js|mjs|css|map|json|txt|xml|ico|png|jpe?g|gif|svg|webp|avif|woff2?|ttf|otf|webmanifest)$/i.test(
                url.pathname,
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "post-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
          // 字体和样式 - 缓存优先
          {
            urlPattern: /\.(woff2|woff|ttf|css)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
          // 图片 - 缓存优先
          {
            urlPattern: /\.(ico|webp|png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
          // JS 资源 - 第三方无 hash JS 需要后台更新
          {
            urlPattern: /\.js$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "js-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
        ],
        // 预缓存构建产物
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,gif,svg,woff2,ttf}"],
        globIgnores: ["**/vp-icons.css", "**/sitemap.xml", "**/rss.xml"],
        // 排除路径
        navigateFallbackDenylist: [
          /^\/sitemap.xml$/,
          /^\/rss.xml$/,
          /^\/robots.txt$/,
          /^\/redirect(?:\.html)?(?:\/|$)/,
        ],
      },
      manifest: {
        name: themeConfig.siteMeta.title,
        short_name: themeConfig.siteMeta.title,
        description: themeConfig.siteMeta.description,
        display: "standalone",
        start_url: "/",
        theme_color: "#fff",
        background_color: "#efefef",
        icons: [
          {
            src: "/images/logo/favicon-32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/images/logo/favicon-96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "/images/logo/favicon-256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "/images/logo/favicon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    },
  }),
);
