<!-- 全局点赞按钮：计数存 Vercel KV（api/like.ts），已赞态存 localStorage -->

<template>
  <div v-if="likeData?.enable" class="like">
    <button
      type="button"
      class="like-btn"
      :class="{ liked }"
      :disabled="pending"
      :aria-pressed="liked"
      aria-label="点赞本文"
      @click="toggleLike"
    >
      <svg
        :key="popKey"
        class="like-icon"
        :class="{ pop: popKey > 0 }"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <span class="count">{{ displayCount }}</span>
    </button>
  </div>
</template>

<script setup>
import { safeStorage } from "@/utils/safeStorage.mjs";

const { theme, page } = useData();
const { likeData } = theme.value;

// 与 Post.vue 同口径的文章 ID
const postId = computed(() => page.value.relativePath);
// null = 加载中 / API 不可达 / KV 未配置，显示 "-"
const count = ref(null);
const liked = ref(false);
const pending = ref(false);
const popKey = ref(0);

// 已赞记录读写（JSON 损坏时降级为空对象；存储异常由 safeStorage 兜底，不抛错）
const readLikes = () => {
  try {
    return JSON.parse(safeStorage.getItem("postLikes") || "{}") || {};
  } catch {
    return {};
  }
};

const writeLikes = (store) => {
  safeStorage.setItem("postLikes", JSON.stringify(store));
};

const displayCount = computed(() => (count.value === null ? "-" : count.value));

// 切篇令牌：postId 变化时自增，在途请求的响应据此作废，避免旧响应污染新文章状态
let reqToken = 0;

const fetchCount = async (id, token) => {
  try {
    const res = await fetch(`/api/like?id=${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (token !== reqToken) return;
    count.value = typeof data.count === "number" ? data.count : null;
  } catch {
    // 纯静态托管（无 /api）或网络失败：保持 "-"
  }
};

// post→post SPA 复用同一实例，切文章时重读状态（对齐 Post.vue 密码态的重置模式）
watch(
  postId,
  (id) => {
    reqToken += 1;
    pending.value = false;
    count.value = null;
    liked.value = !!readLikes()[id];
    fetchCount(id, reqToken);
  },
  { immediate: true },
);

const toggleLike = async () => {
  if (pending.value) return;
  const id = postId.value;
  const token = reqToken;
  const willLike = !liked.value;
  const prevCount = count.value;
  pending.value = true;

  // 乐观更新
  liked.value = willLike;
  if (typeof prevCount === "number") {
    count.value = Math.max(0, prevCount + (willLike ? 1 : -1));
  }
  if (willLike) popKey.value += 1;

  const store = readLikes();
  if (willLike) store[id] = true;
  else delete store[id];
  writeLikes(store);

  let failed = false;
  let failureNotified = false;
  let serverCount = null;
  try {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: willLike ? "inc" : "dec" }),
    });
    if (res.ok) {
      const data = await res.json();
      serverCount = typeof data.count === "number" ? data.count : null;
    } else {
      failed = true;
      if (res.status === 429 && typeof $message !== "undefined") {
        failureNotified = true;
        $message.warning("点赞太频繁了，请稍后再试");
      }
    }
  } catch {
    failed = true;
  }

  if (failed && !failureNotified && typeof $message !== "undefined") {
    $message.error("点赞失败，请稍后再试");
  }

  // localStorage 始终按 id 恢复（不受切篇影响）
  if (failed) {
    const restored = readLikes();
    if (willLike) delete restored[id];
    else restored[id] = true;
    writeLikes(restored);
  }
  // UI 只在「仍是同一篇」时回写：挡住写到新文章；
  // 含离开再切回同一篇的窗口（watch 已按乐观 localStorage 恢复过，失败时须再对齐）
  if (postId.value === id) {
    if (failed) {
      liked.value = !!readLikes()[id];
      // 同轮失败才回滚 count；切回后的旧响应 count 已过期，交由在途 fetchCount 对齐
      if (token === reqToken) {
        count.value = prevCount;
      }
    } else {
      count.value = serverCount;
    }
  }
  // pending 仅本轮请求释放：切走时 watch 已重置，避免旧响应解锁新一篇的按钮
  if (token === reqToken) {
    pending.value = false;
  }
};
</script>

<style lang="scss" scoped>
.like {
  display: flex;
  justify-content: center;
  width: max-content;
  margin: 1rem auto;
  user-select: none;

  .like-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 40px;
    padding: 0 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    color: var(--main-font-second-color);
    background-color: var(--main-card-border);
    cursor: pointer;
    transition:
      color 0.3s,
      background-color 0.3s,
      transform var(--press-out) var(--press-ease);

    .like-icon {
      width: 18px;
      height: 18px;
      margin-right: 6px;
      transition: color 0.3s;
    }

    .count {
      min-width: 1em;
      text-align: left;
    }

    &:hover {
      color: var(--main-color);
      background-color: var(--main-color-bg);
      .like-icon {
        color: var(--main-color);
      }
    }

    &:active {
      transform: scale(0.95);
      transition-duration: var(--press-in);
    }

    &:disabled {
      cursor: default;
    }

    &.liked {
      color: var(--main-color-red);
      .like-icon {
        color: var(--main-color-red);
      }
      &:hover {
        color: var(--main-color-red);
        background-color: var(--main-color-bg);
        .like-icon {
          color: var(--main-color-red);
        }
      }
    }
  }
}

@keyframes like-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1);
  }
}

.like-icon.pop {
  animation: like-pop 0.35s var(--press-ease);
}
</style>
