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
  <!-- 移动端文章阅读入口：打开小组件面板，目录固定排在首位 -->
  <Teleport to="body">
    <button
      ref="tocEntryRef"
      v-show="showMobileTocEntry"
      :class="[
        'mobile-toc-entry',
        { hidden: store.footerIsShow, 'is-blurred': store.backgroundBlur },
      ]"
      type="button"
      aria-label="打开目录与小组件"
      :aria-expanded="store.mobileWidgetsShow"
      aria-haspopup="dialog"
      @click.prevent.stop="store.changeShowStatus('mobileWidgetsShow')"
    >
      <i class="iconfont icon-toc" />
    </button>
  </Teleport>
</template>

<script setup>
import { mainStore } from "@/store";
import { daysPassedAt, formatTimestampAt, useClientNow } from "@/utils/useClientNow.mjs";
import { useIsMobileLayout } from "@/utils/layout.js";
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
const store = mainStore();
const isMobileLayout = useIsMobileLayout();
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

// 移动端目录入口遵循小组件面板开关，密码文章解锁后才提供目录
const showMobileTocEntry = computed(
  () =>
    isMobileLayout.value &&
    store.mobileWidgetsEnabled &&
    theme.value.aside?.toc?.enable === true &&
    (!hasPassword.value || isUnlocked.value),
);

// 移动端播放器胶囊可见时，目录按钮需要向上避让，避免与歌词胶囊重叠
const isPlayerPillVisible = computed(
  () =>
    isMobileLayout.value &&
    store.islandStyle === "extended" &&
    store.playerShow &&
    theme.value.music?.enable === true,
);

const tocEntryRef = ref(null);
// 播放器胶囊宽度会随歌词长度变化：只有真实压到左下角时才抬高按钮
let playerResizeObserver = null;
let playerMutationObserver = null;
let playerStackEl = null;
let tocEntryFrame = null;
let tocEntryAlive = false;

const measureTocEntryPosition = () => {
  const button = tocEntryRef.value;
  if (!button) return;
  const stack = document.querySelector(".pill-stack");
  if (!isPlayerPillVisible.value || !stack) {
    button.style.setProperty("--mobile-toc-raise", "0px");
    return;
  }
  const buttonRect = button.getBoundingClientRect();
  if (!buttonRect.width) {
    button.style.setProperty("--mobile-toc-raise", "0px");
    return;
  }
  // 按钮基准位置与播放器共用同一条底部基线，不受当前抬高影响
  const baseBottom = parseFloat(getComputedStyle(stack).bottom) || 0;
  const baseButtonBottom = window.innerHeight - baseBottom;
  const gap = 8;
  const obstacles = Array.from(
    stack.querySelectorAll(".pill-card, .pill-ctrl-bar, .pill-lyric"),
  ).filter((el) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    // 只要实体横向进入按钮所在列，就整体避让，避免抬高后撞上控制条
    return rect.left < buttonRect.right + gap && rect.right > buttonRect.left - gap;
  });
  if (!obstacles.length) {
    button.style.setProperty("--mobile-toc-raise", "0px");
    return;
  }
  // 抬高到最上方障碍物之上，展开播放器面板时也不会被遮住
  const obstacleTop = Math.min(...obstacles.map((el) => el.getBoundingClientRect().top));
  const raise = Math.max(0, baseButtonBottom - obstacleTop + gap);
  button.style.setProperty("--mobile-toc-raise", `${Math.round(raise)}px`);
};

const scheduleTocEntryMeasure = () => {
  if (typeof window === "undefined") return;
  if (tocEntryFrame) cancelAnimationFrame(tocEntryFrame);
  tocEntryFrame = requestAnimationFrame(() => {
    tocEntryFrame = null;
    measureTocEntryPosition();
  });
};

const disconnectPlayerObservers = () => {
  playerResizeObserver?.disconnect();
  playerMutationObserver?.disconnect();
  playerResizeObserver = null;
  playerMutationObserver = null;
  if (playerStackEl) {
    playerStackEl.removeEventListener("transitionend", scheduleTocEntryMeasure);
    playerStackEl = null;
  }
};

const observePlayerStack = () => {
  disconnectPlayerObservers();
  if (!isPlayerPillVisible.value) {
    tocEntryRef.value?.style.setProperty("--mobile-toc-raise", "0px");
    return;
  }
  nextTick(() => {
    if (!tocEntryAlive) return;
    const stack = document.querySelector(".pill-stack");
    if (!stack || typeof ResizeObserver === "undefined") return;
    playerStackEl = stack;
    // 展开/收起使用 transform 过渡，尺寸不变但位置会变，过渡结束后补测一次
    stack.addEventListener("transitionend", scheduleTocEntryMeasure);
    playerResizeObserver = new ResizeObserver(scheduleTocEntryMeasure);
    const observeStackChildren = () => {
      playerResizeObserver.disconnect();
      playerResizeObserver.observe(stack);
      stack.querySelectorAll(".pill-card, .pill-ctrl-bar, .pill-lyric").forEach((el) => {
        playerResizeObserver.observe(el);
      });
      scheduleTocEntryMeasure();
    };
    playerMutationObserver = new MutationObserver(observeStackChildren);
    playerMutationObserver.observe(stack, { childList: true, subtree: true });
    observeStackChildren();
  });
};

watch(isPlayerPillVisible, () => observePlayerStack());
watch(showMobileTocEntry, () => scheduleTocEntryMeasure());
watch(
  () => store.footerIsShow,
  () => scheduleTocEntryMeasure(),
);

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
  tocEntryAlive = true;
  loadPostData();
  initFancybox(theme.value);
  loadCodeFontIfNeeded();
  observePlayerStack();
  window.addEventListener("resize", scheduleTocEntryMeasure, { passive: true });
  // 解锁状态由 PasswordProtect 自行检查（加密文章需先解密出内容）
});

onBeforeUnmount(() => {
  tocEntryAlive = false;
  disconnectPlayerObservers();
  if (tocEntryFrame) cancelAnimationFrame(tocEntryFrame);
  window.removeEventListener("resize", scheduleTocEntryMeasure);
});
</script>

<style lang="scss" scoped>
@use "../style/post.scss";

.mobile-toc-entry {
  position: fixed;
  left: 20px;
  bottom: calc(
    var(--player-pill-bottom) + env(safe-area-inset-bottom, 0px) + var(--mobile-toc-raise, 0px)
  );
  z-index: var(--z-player);
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--player-pill-height);
  height: var(--player-pill-height);
  min-height: var(--player-pill-height);
  padding: 0;
  pointer-events: auto;
  touch-action: manipulation;
  border: 1px solid var(--main-card-border);
  border-radius: 999px;
  color: var(--main-font-color);
  background-color: var(--main-card-background);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  cursor: pointer;
  transition:
    opacity 0.3s,
    transform 0.3s,
    bottom 0.3s ease,
    color 0.3s,
    border-color 0.3s,
    background-color 0.3s;
  .iconfont {
    font-size: 18px;
    opacity: 0.75;
  }
  &:hover {
    color: var(--main-color);
    border-color: var(--main-color);
    background-color: var(--main-color-bg);
  }
  &:active {
    transform: scale(0.95);
    transition-duration: var(--press-in);
  }
  &.hidden {
    opacity: 0;
    transform: translateY(100px);
    pointer-events: none;
  }
  &.is-blurred {
    background-color: var(--frosted-card-background);
    -webkit-backdrop-filter: blur(var(--frosted-blur));
    backdrop-filter: blur(var(--frosted-blur));
  }
}

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
