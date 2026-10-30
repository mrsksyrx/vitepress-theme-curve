<!-- 文章页面 -->
<template>
  <div v-if="postMetaData" class="post">
    <div class="post-meta">
      <div class="meta">
        <div class="categories">
          <a
            v-for="(item, index) in asArray(postMetaData.categories)"
            :key="index"
            :href="`/pages/categories/${encodeURIComponent(item)}`"
            class="cat-item"
          >
            <i class="iconfont icon-folder" />
            <span class="name">{{ item }}</span>
          </a>
        </div>
        <div class="tags">
          <a
            v-for="(item, index) in asArray(postMetaData.tags)"
            :key="index"
            :href="`/pages/tags/${encodeURIComponent(item)}`"
            class="tag-item"
          >
            <i class="iconfont icon-hashtag" />
            <span class="name">{{ item }}</span>
          </a>
        </div>
      </div>
      <h1 class="title">
        {{ postMetaData.title || "未命名文章" }}
      </h1>
      <div class="other-meta">
        <div class="meta-row">
          <span class="meta date">
            <i class="iconfont icon-date" />
            {{ formatTimestampAt(postMetaData.dateYMD || postMetaData.date, now) }}
          </span>
          <span class="update meta">
            <i class="iconfont icon-time" />
            {{ formatTimestampAt(page?.lastUpdated || postMetaData.lastModified, now) }}
          </span>
          <!-- 热度 -->
          <span class="hot meta">
            <i class="iconfont icon-fire" />
            <span id="twikoo_visitors" class="artalk-pv-count">-</span>
          </span>
          <!-- 分享 -->
          <span class="share meta hover" title="分享本页" @click="openSharePanel">
            <svg
              class="share-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span class="name">分享</span>
          </span>
        </div>
        <div class="meta-row stats">
          <!-- 字数 -->
          <span v-if="postMetaData.wordCount" class="meta">
            <i class="iconfont icon-article" />
            {{ postMetaData.wordCount.toLocaleString() }} 字
          </span>
          <!-- 阅读时间 -->
          <span v-if="postMetaData.readTime" class="meta">
            <i class="iconfont icon-time" />
            约 {{ postMetaData.readTime }} 分钟
          </span>
        </div>
      </div>
      <!-- 评论数 -->
      <!-- <span class="chat meta hover" @click="commentRef?.scrollToComments">
        <i class="iconfont icon-chat" />
        <span id="twikoo_comments" class="artalk-comment-count">0</span>
      </span> -->
    </div>
    <!-- 密码保护 - 全屏显示 -->
    <div v-if="hasPassword && !isUnlocked" class="password-protect-wrapper">
      <PasswordProtect
        :password="frontmatter.password"
        :enc="frontmatter.enc"
        :postId="postId"
        @unlocked="handleUnlocked"
      />
    </div>
    <!-- 文章正文内容 -->
    <div v-else class="post-content">
      <article class="post-article s-card">
        <!-- 字数 / 阅读时间：移动端挪到正文开头，桌面端仍在标题下方 -->
        <div class="article-stats">
          <span v-if="postMetaData.wordCount" class="meta">
            <i class="iconfont icon-article" />
            {{ postMetaData.wordCount.toLocaleString() }} 字
          </span>
          <span v-if="postMetaData.readTime" class="meta">
            <i class="iconfont icon-time" />
            约 {{ postMetaData.readTime }} 分钟
          </span>
        </div>
        <!-- 过期提醒 -->
        <div class="expired s-card" v-if="expiredDays !== null && expiredDays >= 180">
          本文发表于 <strong>{{ expiredDays }}</strong> 天前，其中的信息可能已经事过境迁
        </div>
        <!-- AI 摘要 -->
        <ArticleGPT />
        <!-- 文章内容：加密文章解锁后用解密 HTML 渲染，其余走 VitePress 渲染产物 -->
        <!-- 加密文解密后补一层 div，与 VitePress Content 的 DOM 结构对齐（标题样式依赖 div > h1/h2/h3） -->
        <div v-if="decryptedHtml !== null" id="page-content" class="markdown-main-style">
          <div v-html="decryptedHtml" />
        </div>
        <Content v-else id="page-content" class="markdown-main-style" />
        <!-- 参考资料 -->
        <References />
        <!-- 版权 -->
        <Copyright v-if="frontmatter.copyright !== false" :postData="postMetaData" />
        <!-- 其他信息 -->
        <div class="other-meta">
          <div class="all-tags">
            <a
              v-for="(item, index) in asArray(postMetaData.tags)"
              :key="index"
              :href="`/pages/tags/${encodeURIComponent(item)}`"
              class="tag-item"
            >
              <i class="iconfont icon-hashtag" />
              <span class="name">{{ item }}</span>
            </a>
          </div>
          <div class="meta-actions">
            <span class="share-btn" @click="openSharePanel">
              <svg
                class="share-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              分享
            </span>
            <EditLink />
            <a href="mailto:feedback@sgexilq.com" class="report">
              <i class="iconfont icon-report" />
              反馈与投诉
            </a>
          </div>
        </div>
        <LikeButton />
        <RewardBtn />
        <!-- 下一篇 -->
        <NextPost />
        <!-- 相关文章 -->
        <RelatedPost />
        <!-- 评论 -->
        <Comments ref="commentRef" />
      </article>
      <Aside v-if="isDesktopAsideVisible" showToc />
    </div>
  </div>
</template>

<script setup>
import { daysPassedAt, formatTimestampAt, useClientNow } from "@/utils/useClientNow.mjs";
import initFancybox from "@/utils/initFancybox";
import { ensureCodeFontLoaded } from "@/utils/fontLoader.mjs";
import { useDesktopAside } from "@/utils/useDesktopAside.mjs";
import { usePostData } from "@/utils/usePostData.mjs";
// 注意：必须从零依赖的 dateAnchor.mjs 引入，不能用 getPostData.mjs ——
// 后者顶部 import 了 globby / fs-extra（Node-only），引入会把它们打进浏览器
// 产物（globby@14 → @sindresorhus/merge-streams → node:stream），导致构建失败：
//   "PassThrough" is not exported by "__vite-browser-external"
import {
  toUTCMidnightTimestamp,
  toDateString,
  toLocalDateStringFromTimestamp,
} from "@/utils/dateAnchor.mjs";
// 同样必须从零依赖模块引入，理由同 dateAnchor.mjs
import { normalizeList } from "@/utils/normalizeList.mjs";
import PasswordProtect from "@/components/PasswordProtect.vue";
import DOMPurify from "dompurify";
const { page, theme, frontmatter } = useData();
const { isDesktopAsideVisible } = useDesktopAside();
const { postData, loadPostData } = usePostData();

// 标签/分类归一化：统一走 normalizeList（唯一实现），避免与构建期口径分叉
const asArray = normalizeList;

// 评论元素
const commentRef = ref(null);

// 相对时间统一基于浏览器本地时钟实时计算，避免静态缓存固化构建时间
const { now } = useClientNow();

// 文章 ID

const postId = computed(() => page.value.relativePath);

// 获取对应文章数据
const postMetaData = computed(() => {
  const loadedPost = postData.value.find((item) => item.id === postId.value);
  if (loadedPost) return loadedPost;

  // 兜底路径：postData 尚未加载或查不到该文章时，直接由 frontmatter 构造。
  // dateYMD 与 getPostData.mjs 同口径（作者日历日）；date 用 UTC 零点锚定，
  // 与 postData.json 一致。展示/归档优先读 dateYMD，彻底避开时区偏移。
  const parsedDate = frontmatter.value.date ? toUTCMidnightTimestamp(frontmatter.value.date) : NaN;
  const date = Number.isNaN(parsedDate) ? page.value.lastUpdated : parsedDate;
  return {
    id: postId.value,
    title: frontmatter.value.title || page.value.title,
    date,
    dateYMD: frontmatter.value.date
      ? toDateString(frontmatter.value.date)
      : toLocalDateStringFromTimestamp(date),
    lastModified: page.value.lastUpdated,
    tags: normalizeList(frontmatter.value.tags),
    categories: normalizeList(frontmatter.value.categories),
    description: frontmatter.value.description,
    regularPath: page.value.relativePath ? `/${page.value.relativePath.replace(/\.md$/, "")}` : "",
    top: frontmatter.value.top,
    cover: frontmatter.value.cover,
  };
});

// 文章发表至今的天数（仅客户端计算）
const expiredDays = computed(() =>
  daysPassedAt(postMetaData.value?.dateYMD || postMetaData.value?.date, now.value),
);

// 打开分享面板：模板里不能直接写 window.$share（会被编译成 _ctx.window）
const openSharePanel = () => window.$share?.open(postMetaData.value?.title);

// 密码保护相关
const hasPassword = computed(() => !!(frontmatter.value.password || frontmatter.value.enc));
const isUnlocked = ref(false);
// 加密文章解密后的正文 HTML
const decryptedHtml = ref(null);

// post→post SPA 路由复用同一实例，切换文章时清空解密态，
// 否则上一篇已解锁的正文会串到下一篇，密码框也不再出现
watch(
  () => page.value.relativePath,
  () => {
    isUnlocked.value = false;
    decryptedHtml.value = null;
    // SPA 复用实例时 onMounted 不再触发，切文章需重检代码字体
    loadCodeFontIfNeeded();
  },
);

// 处理解锁事件（加密文章传入解密 HTML，旧版明文密码无参数）
const handleUnlocked = async (html) => {
  // 纵深防御：解密 HTML 仍走 v-html，先过一遍 DOMPurify
  // （默认已放行 data-* / class / style，此处补齐任务清单复选框）
  // undefined 是旧版明文密码解锁，不提供解密 HTML，继续走 <Content />；
  // "" 是加密文章的空正文，必须保留为空字符串，不能回落到 <Content />。
  decryptedHtml.value =
    html === undefined
      ? null
      : DOMPurify.sanitize(html ?? "", {
          ADD_TAGS: ["input"],
          ADD_ATTR: ["checked", "disabled"],
        });
  isUnlocked.value = true;
  // 解密内容晚于首次挂载插入，代码高亮需要补一次
  await nextTick();
  loadCodeFontIfNeeded();
};

const loadCodeFontIfNeeded = async () => {
  await nextTick();
  if (document.querySelector('.markdown-main-style div[class*="language-"]')) {
    ensureCodeFontLoaded();
  }
};

onMounted(() => {
  loadPostData();
  initFancybox(theme.value);
  loadCodeFontIfNeeded();
  // 解锁状态由 PasswordProtect 自行检查（加密文章需先解密出内容）
});
</script>

<style lang="scss" scoped>
@use "../style/post.scss";

.password-protect-wrapper {
  width: 100%;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fade-up 0.6s 0.3s backwards;
}

.post {
  width: 100%;
  display: flex;
  flex-direction: column;
  animation: fade-up 0.6s 0.1s backwards;
  .post-meta {
    padding: 2rem 0 3rem 18px;
    width: 100%;
    .meta {
      display: flex;
      flex-direction: row;
      align-items: center;
      .categories {
        margin-right: 12px;
        .cat-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 8px;
          background-color: var(--main-mask-Inverse-background);
          opacity: 0.8;
          .iconfont {
            margin-right: 6px;
          }
          &:hover {
            color: var(--main-color);
            background-color: var(--main-color-bg);
            .iconfont {
              color: var(--main-color);
            }
          }
          &:active {
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
      }
      .tags {
        display: flex;
        flex-direction: row;
        align-items: center;
        .tag-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 8px;
          opacity: 0.8;
          .iconfont {
            margin-right: 4px;
            opacity: 0.6;
            font-weight: normal;
          }
          &:hover {
            color: var(--main-color);
            background-color: var(--main-color-bg);
            .iconfont {
              color: var(--main-color);
            }
          }
          &:active {
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
      }
    }
    .title {
      font-size: 2.2rem;
      line-height: 1.2;
      color: var(--main-font-color);
      margin: 1.4rem 0;
    }
    .other-meta {
      display: flex;
      flex-direction: row;
      align-items: center;
      // 桌面端把两个分组拆平，单项排列顺序与拆分前保持一致
      .meta-row {
        display: contents;
      }
      .meta {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 6px 12px;
        font-size: 14px;
        border-radius: 8px;
        opacity: 0.8;
        white-space: nowrap;
        .iconfont {
          margin-right: 6px;
          transition: color 0.3s;
        }
        &.date {
          padding-left: 0;
        }
        &.hot {
          // 热度被编进了第一组，桌面端用 order 还原到末位
          order: 5;
          .iconfont {
            font-size: 18px;
          }
        }
        &.share {
          // 分享按钮排在热度之后
          order: 6;
          .share-icon {
            width: 16px;
            height: 16px;
            margin-right: 6px;
          }
        }
        &.hover {
          transition:
            color 0.3s,
            background-color 0.3s,
            transform var(--press-out) var(--press-ease);
          cursor: pointer;
          &:hover {
            color: var(--main-color);
            background-color: var(--main-color-bg);
            .iconfont {
              color: var(--main-color);
            }
          }
          &:active {
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
      }
    }
  }
  .post-content {
    width: 100%;
    display: flex;
    flex-direction: row;
    animation: fade-up 0.6s 0.3s backwards;
    .post-article {
      width: calc(100% - 300px);
      padding: 1rem 2.2rem 2.2rem 2.2rem;
      user-select: text;
      cursor: auto;
      &:hover {
        border-color: var(--main-card-border);
      }
      // 移动端专属：字数 / 阅读时间，桌面端隐藏（值仍在标题下方）
      .article-stats {
        display: none;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        margin-bottom: 1.2rem;
        font-size: 14px;
        color: var(--main-font-second-color);
        .meta {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          opacity: 0.8;
          white-space: nowrap;
          .iconfont {
            margin-right: 6px;
          }
          // 首项贴齐正文左边缘（与标题下方 .meta.date 的处理一致）
          &:first-child {
            padding-left: 0;
          }
        }
      }
      .expired {
        border: solid transparent 0;
        margin: 1.2rem 0 2rem 0;
        padding: 0.8rem 1.2rem;
        border-left: 6px solid var(--main-warning-color);
        border-radius: 8px 16px 16px 8px;
        user-select: none;
        strong {
          color: var(--main-warning-color);
        }
      }
      .other-meta {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin: 2rem 0;
        opacity: 0.8;
        .all-tags {
          display: flex;
          flex-direction: row;
          align-items: center;
          .tag-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 6px 12px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 8px;
            background-color: var(--main-card-border);
            margin-right: 12px;
            .iconfont {
              margin-right: 4px;
              opacity: 0.6;
              font-weight: normal;
            }
            &:hover {
              color: var(--main-color);
              background-color: var(--main-color-bg);
              .iconfont {
                color: var(--main-color);
              }
            }
            &:active {
              transform: scale(0.95);
              transition-duration: var(--press-in);
            }
          }
        }
        .meta-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .share-btn {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 8px;
          background-color: var(--main-card-border);
          white-space: nowrap;
          cursor: pointer;
          transition:
            color 0.3s,
            background-color 0.3s,
            transform var(--press-out) var(--press-ease);
          .share-icon {
            width: 16px;
            height: 16px;
            margin-right: 6px;
          }
          &:hover {
            color: var(--main-color);
            background-color: var(--main-color-bg);
          }
          &:active {
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
        .report {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 8px;
          background-color: var(--main-card-border);
          .iconfont {
            margin-right: 6px;
          }
          &:hover {
            color: #efefef;
            background-color: var(--main-error-color);
            .iconfont {
              color: #efefef;
            }
          }
        }
      }
    }
    .main-aside {
      width: 300px;
      padding-left: 1rem;
    }
    @media (max-width: 768px) {
      .post-article {
        width: 100%;
      }
      .main-aside {
        display: none;
      }
    }
  }
  @media (max-width: 768px) {
    .post-meta {
      padding: 4rem 1.5rem;
      .meta {
        justify-content: center;
        .categories {
          margin-right: 0;
        }
        .tags {
          display: none;
        }
      }
      .title {
        font-size: 1.6rem;
        text-align: center;
        line-height: 40px;
      }
      .other-meta {
        justify-content: center;
        // 窄屏把分组还原成真实容器
        .meta-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        // 字数 / 阅读时间在移动端移到正文开头
        .meta-row.stats {
          display: none;
        }
      }
    }
    .post-content {
      .post-article {
        border: none;
        padding: 20px 30px;
        .article-stats {
          display: flex;
        }
        .other-meta {
          margin: 1rem 0 2rem 0;
          flex-direction: column;
          .all-tags {
            flex-wrap: wrap;
            .tag-item {
              margin-top: 12px;
            }
          }
          .meta-actions {
            margin-top: 20px;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }
        }
      }
    }
  }
}
</style>
