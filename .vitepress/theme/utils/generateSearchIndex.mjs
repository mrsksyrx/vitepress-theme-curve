import matter from "gray-matter";
import fs from "fs-extra";
import { getPostMDFilePaths } from "./getPostData.mjs";
import { normalizeList } from "./normalizeList.mjs";

// 正文纯文本截断上限：防超长文撑爆 PWA precache 体积
const CONTENT_MAX = 8000;

// 提取 ATX 标题文本（粗略剥离行内标记即可，仅作可搜索字段）
const extractHeadings = (md) => {
  const headings = [];
  const re = /^#{1,6}\s+(.+)$/gm;
  let match = re.exec(md);
  while (match) {
    headings.push(match[1].replace(/[#*`~[\]()]/g, "").trim());
    match = re.exec(md);
  }
  return headings;
};

// markdown → 纯文本：顺序敏感——先剥块级，最后折叠空白
const toPlainText = (md) => {
  let text = md;
  text = text.replace(/```[\s\S]*?```/g, " "); // 代码块（含语言标记行）
  text = text.replace(/`[^`]+`/g, " "); // 行内代码
  text = text.replace(/\$\$[\s\S]*?\$\$/g, " "); // 块级公式
  text = text.replace(/\$[^$]+\$/g, " "); // 行内公式
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " "); // 图片（先于链接）
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // 链接留文字
  text = text.replace(/^#{1,6}\s+/gm, ""); // 标题井号
  text = text.replace(/^:::[^\n]*$/gm, " "); // vitepress 容器标记（::: tip 等）
  text = text.replace(/<[^>]+>/g, " "); // HTML 标签
  text = text.replace(/[*_~>|]/g, " "); // 强调/引用/表格符号
  return text.replace(/\s+/g, " ").trim();
};

/**
 * 构建期生成本地全文搜索索引
 * @returns {Promise<{version: number, generatedAt: number, posts: object[]}>}
 */
export const generateSearchIndex = async () => {
  const paths = await getPostMDFilePaths();
  const posts = await Promise.all(
    paths.map(async (item) => {
      const { data, content: body } = matter(await fs.readFile(item, "utf-8"));
      // 密文文章（frontmatter password / enc）不落 headings/description/content，
      // 否则等于把 AES-GCM 保护的明文泄进 public/ 产物（会被 PWA precache 进公网缓存）
      const isProtected = Boolean(data.password || data.enc);
      return {
        // 与 getAllPosts 的 regularPath 同口径（见 getPostData.mjs）
        url: `/${item.replace(/\.md$/, "")}`,
        title: data.title || "未命名文章",
        headings: isProtected ? [] : extractHeadings(body),
        tags: normalizeList(data.tags),
        categories: normalizeList(data.categories),
        description: isProtected ? "" : data.description || "",
        content: isProtected ? "" : toPlainText(body).slice(0, CONTENT_MAX),
      };
    }),
  );
  return { version: 1, generatedAt: Date.now(), posts };
};
