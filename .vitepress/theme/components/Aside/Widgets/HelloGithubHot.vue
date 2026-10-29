<template>
  <!-- 默认移动端不渲染；小组件浮层可传 showOnMobile 强制显示 -->
  <div v-if="showOnMobile || !isMobile" class="site-data s-card">
    <div class="title">
      <i class="iconfont icon-chart"></i>
      <span class="title-name">HelloGithub 热榜</span>
    </div>

    <!-- 加载中：骨架屏明确提示请求正在进行 -->
    <div v-if="loading" class="hot-status hot-loading" role="status" aria-live="polite">
      <div class="loading-caption">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>正在加载热榜...</span>
      </div>
      <div class="skeleton-list" aria-hidden="true">
        <div v-for="n in SKELETON_COUNT" :key="n" class="skeleton-item">
          <span class="skeleton-rank"></span>
          <span class="skeleton-line" :class="{ wide: n % 2 === 0 }"></span>
        </div>
      </div>
    </div>

    <!-- 请求失败：保留卡片并提供重试，不修改用户开关 -->
    <div v-else-if="error" class="hot-status hot-error" role="alert">
      <span>{{ error }}</span>
      <button v-if="canRetry" type="button" class="retry-button" @click="fetchData">重试</button>
    </div>

    <!-- 接口成功但没有条目 -->
    <div v-else-if="!list.length" class="hot-status hot-empty">
      <span>暂无热榜数据</span>
      <button type="button" class="retry-button" @click="fetchData">刷新</button>
    </div>

    <template v-else>
      <!-- 桌面端限制约 5 条高度并可滚动；expandAll 时完整展开 -->
      <div class="all-data" :class="{ expanded: expandAll }">
        <div class="data-item" v-for="(item, index) in list" :key="item.id || item.url">
          <span class="name">{{ index + 1 }}.</span>
          <span class="num">
            <a :href="item.url" target="_blank" rel="noopener noreferrer">
              {{ item.title }}
            </a>
          </span>
        </div>
      </div>

      <!-- 最后更新时间 -->
      <div v-if="formattedUpdateTime" class="update-time">最后更新：{{ formattedUpdateTime }}</div>
    </template>
  </div>
</template>

<script setup>
import { useIsMobileLayout } from "@/utils/layout.js";

const isMobile = useIsMobileLayout();

const props = defineProps({
  // 移动端浮层等场景强制显示并拉取
  showOnMobile: {
    type: Boolean,
    default: false,
  },
  // 不折叠：展示全部条目（侧边栏默认只露前 5 条）
  expandAll: {
    type: Boolean,
    default: false,
  },
});

const list = ref([]);
const rawUpdateTime = ref("");
const loading = ref(true);
const error = ref("");

const API_URL = import.meta.env.VITE_HELLOGITHUB_API_URL || "";
const REQUEST_TIMEOUT = 10000;
const SKELETON_COUNT = 5;

let fetchId = 0;
let requestController = null;

// 将 ISO 时间解析成 'YYYY-MM-DD HH:mm:ss'；字段缺失或非法时直接隐藏
const formattedUpdateTime = computed(() => {
  if (!rawUpdateTime.value) return "";
  const d = new Date(rawUpdateTime.value);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
});

const canRetry = computed(() => Boolean(API_URL));

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeItems(data) {
  if (!Array.isArray(data)) throw new Error("热榜接口返回的数据格式不正确");

  const items = data
    .filter(
      (item) => item && typeof item.title === "string" && item.title.trim() && isHttpUrl(item.url),
    )
    .map((item) => ({ ...item, title: item.title.trim() }));

  // 接口返回了条目但全部非法，视为数据异常而不是空榜单
  if (data.length && !items.length) throw new Error("热榜条目格式不正确");
  return items;
}

async function fetchData() {
  const currentFetch = ++fetchId;
  requestController?.abort();

  const controller = new AbortController();
  requestController = controller;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);

  loading.value = true;
  error.value = "";

  try {
    if (!API_URL) throw new Error("未配置 HelloGithub 热榜接口");

    const res = await fetch(API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`热榜接口请求失败（HTTP ${res.status}）`);

    const data = await res.json();
    if (currentFetch !== fetchId) return;

    list.value = normalizeItems(data?.data);
    rawUpdateTime.value = typeof data?.updateTime === "string" ? data.updateTime : "";
  } catch (err) {
    if (currentFetch !== fetchId || (err?.name === "AbortError" && !timedOut)) return;

    console.error("HelloGithub 热榜加载失败", err);
    if (timedOut) {
      error.value = "热榜请求超时";
    } else if (err instanceof SyntaxError) {
      error.value = "热榜接口返回的数据格式错误";
    } else if (err instanceof TypeError) {
      error.value = "网络连接失败，请稍后重试";
    } else {
      error.value = err instanceof Error && err.message ? err.message : "热榜加载失败";
    }
  } finally {
    clearTimeout(timeoutId);
    if (currentFetch === fetchId) {
      loading.value = false;
      requestController = null;
    }
  }
}

onMounted(() => {
  // 移动端侧边栏默认不挂载，小组件浮层通过 showOnMobile 强制拉取
  if (!props.showOnMobile && isMobile.value) {
    loading.value = false;
    return;
  }

  fetchData();
});

onBeforeUnmount(() => {
  fetchId += 1;
  requestController?.abort();
  requestController = null;
});
</script>

<style lang="scss" scoped>
.site-data {
  margin-bottom: 1rem;
  .iconfont {
    opacity: 0.6;
    margin-right: 6px;
  }
  .title-name {
    opacity: 0.8;
  }
  .title {
    padding: 0.3rem 0.5rem;
    margin-bottom: 5px;
    font-weight: bold;
    display: flex;
    align-items: center;
    opacity: 0.75;
  }

  .hot-status {
    color: var(--main-font-second-color);
    font-size: 14px;
  }

  .hot-loading {
    padding: 0.2rem 0.1rem 0;

    .loading-caption {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 8px;
      opacity: 0.75;
    }

    .loading-spinner {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      border: 2px solid var(--main-card-border);
      border-top-color: var(--main-color);
      border-radius: 50%;
      animation: rotate 0.8s linear infinite;
    }

    .skeleton-item {
      display: flex;
      align-items: center;
      padding: 0.35rem 0.1rem;

      .skeleton-rank,
      .skeleton-line {
        height: 14px;
        border-radius: 5px;
        background: linear-gradient(
          90deg,
          var(--main-card-border) 25%,
          var(--main-card-background) 37%,
          var(--main-card-border) 63%
        );
        background-size: 400% 100%;
        animation: skeleton-loading 1.4s ease infinite;
      }

      .skeleton-rank {
        width: 1.2rem;
        flex-shrink: 0;
      }

      .skeleton-line {
        flex: 1;
        max-width: 78%;
        margin-left: 0.6rem;

        &.wide {
          max-width: 92%;
        }
      }
    }
  }

  .hot-error,
  .hot-empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 2px;

    .retry-button {
      padding: 3px 10px;
      border: 1px solid var(--main-card-border);
      border-radius: 8px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition:
        background-color 0.3s,
        border-color 0.3s;

      &:hover {
        background-color: var(--main-color-bg);
        border-color: var(--main-color);
      }
    }
  }

  .hot-error {
    color: var(--main-red, #e05a5a);
  }

  .all-data {
    max-height: 9rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--main-card-border) transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--main-card-border);
      border-radius: 2px;
    }

    &.expanded {
      max-height: none;
      overflow: visible;
    }
    .data-item {
      display: flex;
      align-items: flex-start;
      padding: 0.2rem 0.1rem;
      line-height: 1.4rem;
      font-size: 14px;

      .name {
        flex-shrink: 0;
        width: 1.2rem;
        text-align: center;
        opacity: 0.8;
        font-weight: bold;
      }
      .num {
        flex: 1;
        margin-left: 0.3rem;
        a {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          white-space: normal;
          opacity: 0.8;
          text-decoration: none;
          // display 为 -webkit-box（非 flex/inline-block 等白名单值），按内联元素处理用透明度
          &:active {
            opacity: 0.6;
            transition-duration: var(--press-in);
          }
        }
      }

      &:last-child {
        padding-bottom: 0;
      }
    }
  }

  /* 更新时间样式 */
  .update-time {
    margin: 0.2rem 0.5rem;
    font-size: 12px;
    color: #888;
    text-align: right;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .skeleton-rank,
  .skeleton-line {
    animation: none;
  }
}
</style>
