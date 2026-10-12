<!-- 顶部阅读进度条 -->
<template>
  <div v-if="isVisible && readingProgressEnabled" class="reading-progress">
    <div class="progress-bar" :style="{ width: `${scrollPercent}%` }" />
    <div class="progress-info" v-if="showInfo">
      <span class="reading-time">{{ formattedReadingTime }}</span>
      <span class="reading-percent">{{ Math.round(scrollPercent) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";

const store = mainStore();
const { readingProgressEnabled, pwaCacheLimit } = storeToRefs(store);
const route = useRoute();
const { frontmatter } = useData();

// 配置
const props = defineProps({
  showInfo: {
    type: Boolean,
    default: false,
  },
});

// 状态
const scrollPercent = ref(0);
const readingStartTime = ref(null);
const totalReadingTime = ref(0);
const isVisible = ref(false);
const isPostPage = ref(false);
const contentSelector = "#page-content";

// 格式化阅读时间
const formattedReadingTime = computed(() => {
  const seconds = Math.floor(totalReadingTime.value);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
});

// 计算滚动百分比
const calculateScrollPercent = () => {
  const contentEl = document.querySelector(contentSelector);
  if (!contentEl) return 0;

  const rect = contentEl.getBoundingClientRect();
  const contentTop = rect.top + window.scrollY;
  const contentHeight = rect.height;
  const windowHeight = window.innerHeight;
  const scrollTop = window.scrollY;

  // 计算已读百分比
  const totalScrollable = contentHeight - windowHeight;
  if (totalScrollable <= 0) return 100;

  const scrolled = scrollTop - contentTop;
  const percent = Math.min(Math.max((scrolled / totalScrollable) * 100, 0), 100);

  return percent;
};

// 更新阅读数据
const updateReadingData = () => {
  if (!isPostPage.value) return;

  scrollPercent.value = calculateScrollPercent();

  // 记录阅读时长
  if (readingStartTime.value && scrollPercent.value > 0) {
    totalReadingTime.value = (Date.now() - readingStartTime.value) / 1000;
  }

  // [B29-原高频写入] 16ms 节流下每次滚动都 parse+stringify+setItem，
  // 改为与滚动解耦：滚动回调只更新内存/进度条，写入走空闲调度。
  // 保存到 localStorage
  // saveReadingData();
  schedulePersist();
};

// 保存阅读数据到 localStorage
// postId 可显式指定（路由切换时落盘上一篇）；默认取当前路由
const saveReadingData = (postId = route.path) => {
  if (!postId) return;

  let readingData = {};
  try {
    readingData = JSON.parse(localStorage.getItem("readingData") || "{}") || {};
  } catch {
    readingData = {};
  }
  readingData[postId] = {
    scrollPercent: Math.round(scrollPercent.value),
    readingTime: Math.floor(totalReadingTime.value),
    lastVisit: Date.now(),
  };

  // 限制存储条目数量（0 表示无限）
  const keys = Object.keys(readingData);
  const limit = pwaCacheLimit.value;
  if (limit > 0 && keys.length > limit) {
    const sortedKeys = keys.sort(
      (a, b) => (readingData[a].lastVisit || 0) - (readingData[b].lastVisit || 0),
    );
    sortedKeys.slice(0, keys.length - limit).forEach((key) => delete readingData[key]);
  }

  localStorage.setItem("readingData", JSON.stringify(readingData));
};

// [B29] 持久化与滚动解耦：静默节流 + 变化阈值 + 空闲写入
// - 静默期 PERSIST_QUIET_MS 内不重复写（原实现每 16ms 都 parse+stringify+setItem）
// - percent / 阅读时长变化未超阈值时直接跳过 setItem
// - 真正的写入丢进 requestIdleCallback，不占用滚动帧
const PERSIST_QUIET_MS = 800;
const PERSIST_PERCENT_THRESHOLD = 1;
const PERSIST_TIME_THRESHOLD = 5;

let persistTimer = null;
let idleHandle = null;
let lastPersisted = { percent: -1, time: -1, at: 0 };

const cancelScheduledPersist = () => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (idleHandle !== null) {
    if (typeof cancelIdleCallback === "function") {
      cancelIdleCallback(idleHandle);
    }
    idleHandle = null;
  }
};

const flushReadingData = (postId) => {
  idleHandle = null;
  const percent = Math.round(scrollPercent.value);
  const time = Math.floor(totalReadingTime.value);
  const percentChanged = Math.abs(percent - lastPersisted.percent) >= PERSIST_PERCENT_THRESHOLD;
  const timeChanged = Math.abs(time - lastPersisted.time) >= PERSIST_TIME_THRESHOLD;
  // 无论是否落盘都推进静默窗口，避免未达阈值时每个滚动帧都重排一次调度
  lastPersisted.at = Date.now();
  if (!percentChanged && !timeChanged) return;
  saveReadingData(postId);
  lastPersisted.percent = percent;
  lastPersisted.time = time;
};

const schedulePersist = () => {
  // 已在排队则不重复调度（节流而非防抖：持续滚动时也保证每 800ms 落盘一次）
  if (persistTimer || idleHandle !== null) return;
  const wait = Math.max(0, PERSIST_QUIET_MS - (Date.now() - lastPersisted.at));
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (typeof requestIdleCallback === "function") {
      idleHandle = requestIdleCallback(() => flushReadingData(), { timeout: 500 });
    } else {
      flushReadingData();
    }
  }, wait);
};

// 加载阅读数据
const loadReadingData = () => {
  const postId = route.path;
  if (!postId) return null;

  let readingData = {};
  try {
    readingData = JSON.parse(localStorage.getItem("readingData") || "{}") || {};
  } catch {
    readingData = {};
  }
  return readingData[postId] || null;
};

// 检查是否为文章页面（posts/ 路径，或 frontmatter 声明 layout: post）
const checkIsPostPage = () => {
  const routePath = decodeURIComponent(route.path);
  isPostPage.value = routePath.includes("/posts/") || frontmatter.value.layout === "post";
  isVisible.value = isPostPage.value;
};

// 开始记录阅读时间
const startReadingTimer = () => {
  if (!readingStartTime.value) {
    readingStartTime.value = Date.now();
  }
};

// 防抖函数
let scrollTimer = null;
const handleScroll = () => {
  if (scrollTimer) return;
  scrollTimer = setTimeout(() => {
    updateReadingData();
    scrollTimer = null;
  }, 16); // 约 60fps
};

// 监听路由变化
watch(
  () => route.path,
  (to, from) => {
    // [B29] 切走前把上一篇的待写数据落盘（此刻 isPostPage 仍反映上一篇），
    // 否则 reset 后的 0 值会被后续空闲写入错记到新路径上
    cancelScheduledPersist();
    if (isPostPage.value && from) {
      saveReadingData(from);
    }
    checkIsPostPage();
    if (isPostPage.value) {
      readingStartTime.value = Date.now();
      totalReadingTime.value = 0;
      scrollPercent.value = 0;
    }
    // 新一篇从零开始计，清空阈值基线以便尽快落盘
    lastPersisted = { percent: -1, time: -1, at: 0 };
  },
);

onMounted(() => {
  checkIsPostPage();
  if (isPostPage.value) {
    startReadingTimer();
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  if (scrollTimer) {
    clearTimeout(scrollTimer);
  }
  // [B29] 卸载前取消待写调度，保留最终写入（直写，不受阈值限制）
  cancelScheduledPersist();
  // 保存最终阅读数据
  saveReadingData();
});
</script>

<style lang="scss" scoped>
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 9999;
  background: transparent;

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--main-color), var(--main-accent));
    transition: width 0.1s ease-out;
    box-shadow: 0 0 10px var(--main-color);
  }

  .progress-info {
    position: fixed;
    top: 12px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    background: var(--main-card-background);
    border: 1px solid var(--main-card-border);
    border-radius: 20px;
    font-size: 12px;
    color: var(--main-font-second-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transform: translateY(-10px);
    transition:
      opacity 0.3s,
      transform 0.3s;
    pointer-events: none;

    .reading-time {
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: "";
        display: inline-block;
        width: 12px;
        height: 12px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cpolyline points='12 6 12 12 16 14'%3E%3C/polyline%3E%3C/svg%3E");
        background-size: contain;
      }
    }

    .reading-percent {
      font-weight: 600;
      color: var(--main-color);
    }
  }

  &:hover .progress-info {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .reading-progress {
    .progress-info {
      right: 10px;
      top: 8px;
      padding: 4px 10px;
      font-size: 11px;
    }
  }
}
</style>
