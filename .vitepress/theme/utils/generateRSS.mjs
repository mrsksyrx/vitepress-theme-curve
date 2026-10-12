import { createContentLoader } from "vitepress";
import { writeFileSync, statSync } from "fs";
import { Feed } from "feed";
import path from "path";

/**
 * 生成 RSS
 * @param {*} config VitePress buildEnd
 * @param {*} themeConfig 主题配置
 */
export const createRssFile = async (config, themeConfig) => {
  // 配置信息
  const siteMeta = themeConfig.siteMeta;
  // 归一化：去掉尾斜杠，避免 hostLink 尾斜杠 + url 前导 / 产生 `//` 分裂 guid
  const hostLink = siteMeta.site.replace(/\/+$/, "");
  // Feed 实例
  const feed = new Feed({
    title: siteMeta.title,
    description: siteMeta.description,
    id: hostLink,
    link: hostLink,
    language: "zh",
    generator: siteMeta.author.name,
    favicon: siteMeta.author.cover,
    copyright: `Copyright © 2020-present ${siteMeta.author.name}`,
    updated: new Date(),
  });
  // 加载文章
  // ⚠️ VitePress 的 createContentLoader **不读** config.mjs 的 srcExclude，
  // 只硬编码忽略 node_modules/dist。若不在这里补齐，`_*.md`（config.mjs:113
  // 注释承诺"绝不发布到站点"的仓库内部文件）会被排除出页面与 sitemap，
  // 却仍然出现在 rss.xml 里，给出指向 404 的订阅条目。
  // 另注意：loader 内部是 `{ ignore: [默认值], ...globOptions }`，ignore 属**整体覆盖**，
  // 所以必须把默认的两项一起写上，否则等于把 node_modules/dist 放回来了。
  let posts = await createContentLoader("posts/**/*.md", {
    render: true,
    globOptions: {
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/README.md",
        "**/TODO.md",
        "_*.md",
        "**/_*.md",
      ],
    },
  }).load();
  // 日期降序排序
  // frontmatter 的 date 可能缺失或非法，`new Date(undefined)` 会得到 NaN，
  // 而 NaN 参与比较会让 Array#sort 的结果不可预测（可能把有日期的文章挤下去）。
  // 这里显式把无法解析的日期排到最后，并用 -Infinity 兜底，保证排序稳定。
  const dateValue = (frontmatter) => {
    const parsed = new Date(frontmatter?.date ?? NaN).getTime();
    return Number.isNaN(parsed) ? -Infinity : parsed;
  };
  posts = posts.sort((a, b) => dateValue(b.frontmatter) - dateValue(a.frontmatter));
  for (const { url, frontmatter } of posts) {
    // 仅保留最近 10 篇文章
    if (feed.items.length >= 10) break;
    // 文章信息（title 兜底对齐 getPostData.mjs）
    let { title, description, date } = frontmatter;
    title = title || "未命名文章";
    // 处理日期：字符串转 Date；缺失/非法时回退到源文件 mtime（对齐 getPostData），
    // 避免 new Date() 导致每次构建 pubDate 漂移、构建不可复现。
    if (typeof date === "string") date = new Date(date);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      try {
        const srcPath = path.resolve(
          process.cwd(),
          url.replace(/^\//, "").replace(/\.html$/, "") + ".md",
        );
        date = new Date(statSync(srcPath).mtimeMs);
      } catch {
        date = new Date(0);
      }
    }
    // 添加文章
    feed.addItem({
      title,
      id: `${hostLink}${url}`,
      link: `${hostLink}${url}`,
      description,
      date,
      // updated,
      author: [
        {
          name: siteMeta.author.name,
          email: siteMeta.author.email,
          link: siteMeta.author.link,
        },
      ],
    });
  }
  // 写入文件
  writeFileSync(path.join(config.outDir, "rss.xml"), feed.rss2(), "utf-8");
};
