import { globby } from "globby";
import matter from "gray-matter";
import fs from "fs-extra";
import { toLocalDayTimestamp } from "./dateAnchor.mjs";
import { normalizeList } from "./normalizeList.mjs";

// 重新导出，保持既有引用（如 `.dsh_baseline` 探针、外部脚本）不失效。
// 实现位于零依赖的 dateAnchor.mjs —— 客户端组件必须从那里引入，
// 否则会把本文件的 globby/fs-extra 拖进浏览器构建。
export { toLocalDayTimestamp };

/**
 * 统计文章字数（中文按字符，英文按单词）
 * @param {string} content - 去除 frontmatter 后的 markdown 原文
 * @returns {number} 字数
 */
const countWords = (content) => {
  // 去除代码块
  let text = content.replace(/```[\s\S]*?```/g, "");
  // 去除行内代码
  text = text.replace(/`[^`]+`/g, "");
  // 去除 markdown 语法标记
  text = text.replace(/[#*_~\[\]()>!|\\-]/g, "");
  // 去除 HTML 标签
  text = text.replace(/<[^>]+>/g, "");
  // 去除链接 url 部分，只保留文字
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // 去除图片
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "");
  // 统计中文字符数
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  // 统计英文单词数（连续字母序列）
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
};

/**
 * 计算阅读时间（分钟）
 * @param {number} wordCount - 字数
 * @returns {number} 阅读时间（分钟），最少 1 分钟
 */
const calcReadTime = (wordCount) => {
  // 中文阅读速度约 400 字/分钟
  return Math.max(1, Math.ceil(wordCount / 400));
};

/**
 * 归一化标签/分类：唯一实现见 normalizeList.mjs（构建期与客户端共用）
 */

/**
 * 获取 posts 目录下所有 Markdown 文件的路径
 * @returns {Promise<string[]>} - 文件路径数组
 */
const getPostMDFilePaths = async () => {
  try {
    // 获取所有 md 文件路径
    let paths = await globby(["**.md"], {
      ignore: [
        "node_modules",
        "pages",
        ".vitepress",
        "**/README.md",
        "**/TODO.md",
        "_*.md",
        "**/_*.md",
      ],
    });
    // 过滤路径，只包括 'posts' 目录下的文件
    return paths.filter((item) => item.includes("posts/"));
  } catch (error) {
    console.error("获取文章路径时出错:", error);
    throw error;
  }
};

/**
 * 基于 frontMatter 日期降序排序文章
 * @param {Object} obj1 - 第一篇文章对象
 * @param {Object} obj2 - 第二篇文章对象
 * @returns {number} - 比较结果
 */
const compareDate = (obj1, obj2) => {
  // 降序（新在前）。并列必须返回 0：date 归一到本地零点后，同日文章时间戳相同，
  // 若写成 `? 1 : -1` 会对并列双向返回 -1，违反比较器全序，TimSort 的稳定性失效，
  // 同日文章的相对顺序会随输入排列漂移。
  return obj2.date - obj1.date;
};
const getTopValue = (top) => {
  if (typeof top === "number") {
    return top;
  }
  if (top === true) {
    return 1;
  }
  if (typeof top === "string") {
    const parsed = Number(top);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const comparePostPriority = (a, b) => {
  const topA = getTopValue(a.top);
  const topB = getTopValue(b.top);
  if (topA !== topB) {
    return topB - topA;
  }
  return compareDate(a, b);
};

/**
 * 获取所有文章，读取其内容并解析 front matter
 * @returns {Promise<Object[]>} - 文章对象数组
 */
export const getAllPosts = async () => {
  try {
    // 获取所有 Markdown 文件的路径
    let paths = await getPostMDFilePaths();
    // 读取和处理每个 Markdown 文件的内容
    let posts = await Promise.all(
      paths.map(async (item) => {
        try {
          // 读取文件内容
          const content = await fs.readFile(item, "utf-8");
          // 文件的元数据
          const stat = await fs.stat(item);
          // 获取文件创建时间和最后修改时间
          const { birthtimeMs, mtimeMs } = stat;
          // 解析 front matter
          const { data, content: markdownBody } = matter(content);
          const { title, date, categories, description, tags, top, cover } = data;
          // 统计字数和阅读时间
          const wordCount = countWords(markdownBody);
          const readTime = calcReadTime(wordCount);
          // date 解析：缺失或非法（toLocalDayTimestamp 返回 NaN）都回退到文件创建时间。
          // NaN 会一路污染排序比较器、归档分组和日期展示，必须在源头消掉。
          const parsedDate = date ? toLocalDayTimestamp(date) : NaN;
          const dateValue = Number.isNaN(parsedDate) ? birthtimeMs : parsedDate;
          if (date && Number.isNaN(parsedDate)) {
            console.warn(
              `文章 '${item}' 的 date 无法解析（${JSON.stringify(date)}），已回退到文件创建时间`,
            );
          }
          // 计算文章的过期天数（基于上面解析出的 dateValue，避免二次解析再得 NaN）
          // 注意：此值在构建期算死并写入 postData.json，部署后不再增长。
          // 实际展示走 Post.vue 的 daysPassedAt（客户端实时计算），此字段当前无消费点。
          // const expired = Math.floor((new Date().getTime() - dateValue) / (1000 * 60 * 60 * 24));
          // tags / categories 在 frontmatter 里可能是数组，也可能是「裸写」字符串
          // （README「写文章」承诺两种写法都支持）。这里统一归一化成数组：
          //   - 字符串若原样透传，模板里的 v-for 会**逐字符**渲染出 404 链接；
          //   - 同时 trim，避免构建期标签路由键与页面链接不一致。
          // 未设置时保持 undefined（而不是空数组），以免模板里 `v-if="item?.tags"`
          // 由「隐藏」变成「渲染空容器」。
          const toListOrUndefined = (value) =>
            value === undefined || value === null || value === ""
              ? undefined
              : normalizeList(value);
          // 返回文章对象
          return {
            id: item,
            title: title || "未命名文章",
            date: dateValue,
            lastModified: mtimeMs,
            // expired, // 构建期冻结，无消费点，见上方说明
            tags: toListOrUndefined(tags),
            categories: toListOrUndefined(categories),
            description,
            regularPath: `/${item.replace(/\.md$/, "")}`,
            top,
            cover,
            wordCount,
            readTime,
          };
        } catch (error) {
          console.error(`处理文章文件 '${item}' 时出错:`, error);
          throw error;
        }
      }),
    );
    // 根据日期排序文章
    posts.sort(comparePostPriority);
    return posts;
  } catch (error) {
    console.error("获取所有文章时出错:", error);
    throw error;
  }
};

/**
 * 获取所有标签及其相关文章的统计信息
 * @param {Object[]} postData - 包含文章信息的数组
 * @returns {Object} - 包含标签统计信息的对象
 */
export const getAllType = (postData) => {
  const tagData = {};
  // 遍历数据
  postData.map((item) => {
    // 用共用的归一化实现（并**不再就地改写** item.tags）：
    // 原先的 `item.tags.split(",")` 不 trim，会让标签路由键变成 " 教程"（URL 里出现 %20），
    // 与页面上的链接不一致；就地变异也会污染同一数组的其它使用者。
    normalizeList(item.tags).forEach((tag) => {
      // 初始化标签的统计信息，如果不存在
      if (!tagData[tag]) {
        tagData[tag] = {
          count: 1,
          articles: [item],
        };
      } else {
        // 如果标签已存在，则增加计数和记录所属文章
        tagData[tag].count++;
        tagData[tag].articles.push(item);
      }
    });
  });
  return tagData;
};

/**
 * 获取所有分类及其相关文章的统计信息
 * @param {Object[]} postData - 包含文章信息的数组
 * @returns {Object} - 包含标签统计信息的对象
 */
export const getAllCategories = (postData) => {
  const catData = {};
  // 遍历数据
  postData.map((item) => {
    // 与 getAllType 同一口径，见上方说明
    normalizeList(item.categories).forEach((tag) => {
      // 初始化标签的统计信息，如果不存在
      if (!catData[tag]) {
        catData[tag] = {
          count: 1,
          articles: [item],
        };
      } else {
        // 如果标签已存在，则增加计数和记录所属文章
        catData[tag].count++;
        catData[tag].articles.push(item);
      }
    });
  });
  return catData;
};
