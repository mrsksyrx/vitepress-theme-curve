<!-- 底部播放器（拓展样式）：三层堆叠 -->
<template>
  <Teleport to="body">
    <div v-if="visible" :class="['pill-stack', { 'pill-hidden': pillStackHidden }]">
      <!-- 第三层（最上）：列表/歌词卡片 -->
      <div class="pill-layer pill-layer-card">
        <Transition name="pill-expand">
          <div v-if="!store.playerFolded" class="pill-card">
            <div class="pill-card-header">
              <span
                :class="{ active: store.playerPanelTab === 'list' }"
                @click="store.playerPanelTab = 'list'"
                >播放列表</span
              >
              <span
                :class="{ active: store.playerPanelTab === 'lrc' }"
                @click="store.playerPanelTab = 'lrc'"
                >歌词</span
              >
            </div>
            <div v-show="store.playerPanelTab === 'list'" class="pill-card-list">
              <div
                v-for="(song, idx) in allSongs"
                :key="song.id || idx"
                :class="['pill-card-item', { active: currentSongIdx === idx }]"
                @click="playSongByIdx(idx)"
              >
                <img class="pill-card-item-cover" :src="song.cover" :alt="song.name" />
                <div class="pill-card-item-info">
                  <span class="pill-card-item-name">{{ song.name }}</span>
                  <span class="pill-card-item-artist">{{ song.artist }}</span>
                </div>
              </div>
            </div>
            <div v-show="store.playerPanelTab === 'lrc'" class="pill-card-lrc">
              <div
                v-if="hasPlayedOnce && pillLyrics.length"
                ref="lrcScrollRef"
                class="pill-card-lrc-scroll"
                @wheel.passive="pauseLyricFollow"
                @touchmove.passive="pauseLyricFollow"
              >
                <div
                  v-for="(line, idx) in pillLyrics"
                  :key="idx"
                  :class="['pill-card-lrc-line', { active: idx === pillLyricIdx }]"
                  @click="seekToLine(idx)"
                >
                  {{ line.text }}
                </div>
              </div>
              <div v-else class="pill-card-lrc-empty">没有播放中的音乐</div>
            </div>
          </div>
        </Transition>
      </div>
      <!-- 第二层（中间）：歌名 + 控制按钮 整个药丸 -->
      <div class="pill-layer pill-layer-controls">
        <Transition name="pill-expand">
          <div v-if="!store.playerFolded" class="pill-ctrl-bar">
            <span class="pill-ctrl-name">
              <Transition name="pill-fade" mode="out-in">
                <span :key="store.playerData?.name" class="pill-ctrl-name-inner">{{
                  store.playerData?.name || "未知曲目"
                }}</span>
              </Transition>
            </span>
            <div class="pill-ctrl-btns" @click.stop>
              <button class="pill-ctrl-btn" @click="prevSong">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>
              <button class="pill-ctrl-btn" @click="togglePlay">
                <svg
                  v-if="!store.playState"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </button>
              <button class="pill-ctrl-btn" @click="nextSong">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M6 18 14.5 12 6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
        </Transition>
      </div>
      <!-- 第一层（最底）：封面 + 歌词 药丸 -->
      <div class="pill-layer pill-layer-lyric">
        <div
          :class="['pill-lyric', { 'island-theme-color': store.islandUseThemeColor }]"
          :style="pillLyricStyle"
          @click="store.playerFolded = !store.playerFolded"
        >
          <div :class="['pill-lyric-cover-wrap', { 'cover-fading': showOldCover }]">
            <div v-if="showOldCover && prevCover" class="cover-old-wrap">
              <img
                :src="prevCover"
                :class="['pill-lyric-cover', { spinning: store.playState }]"
                alt=""
              />
            </div>
            <div class="cover-new-wrap">
              <img
                v-if="store.playerData?.cover"
                :key="store.playerData.cover"
                :src="store.playerData.cover"
                :class="['pill-lyric-cover', { spinning: store.playState }]"
                alt=""
              />
            </div>
          </div>
          <span class="pill-lyric-text">
            <Transition name="pill-text" mode="out-in">
              <span :key="displayLyric" class="pill-lyric-text-inner">{{ displayLyric }}</span>
            </Transition>
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";

const store = mainStore();
const { playerData, playState } = storeToRefs(store);

const visible = computed(() => store.islandStyle === "extended" && store.playerShow);
const pillStackHidden = ref(false);
const isMobile = ref(typeof window !== "undefined" && window.innerWidth <= 768);

// 显示歌词：播放中但未到第一行时显示第一行，暂停后保持当前歌词
const displayLyric = computed(() => {
  if (!hasPlayedOnce.value) return "Player";
  if (store.playerLyric) return store.playerLyric;
  if (pillLyrics.value.length) return pillLyrics.value[0].text;
  return "暂无歌词";
});

// 歌曲列表
const allSongs = ref([]);
const currentSongIdx = ref(0);
const pillLyrics = ref([]);
const pillLyricIdx = ref(-1);
const lrcScrollRef = ref(null);
const userScrolling = ref(false);
let followResumeTimer = null;
const hasPlayedOnce = ref(false);
const prevCover = ref("");

// 胶囊宽度：未播放时基于"Player"文本，播放后取最长歌词并固定
const pillLyricWidth = computed(() => {
  if (!hasPlayedOnce.value) return "Player".length * 14 + 32;
  if (pillLyrics.value.length) {
    const maxLen = Math.max(...pillLyrics.value.map((l) => l.text.length));
    const capped = Math.min(maxLen, 30);
    return capped * 14 + 32;
  }
  return "Player".length * 14 + 32;
});

const pillLyricStyle = computed(() => {
  const textWidth = pillLyricWidth.value;
  const maxW = typeof window !== "undefined" ? Math.min(480, window.innerWidth - 32) : 480;
  return { width: Math.min(textWidth, maxW) + "px" };
});

// 从全局播放器同步
const syncFromPlayer = () => {
  const p = window.$player;
  if (!p) return;
  allSongs.value = p.list?.audios || [];
  const idx = p.list?.index ?? 0;
  currentSongIdx.value = idx;
  // 更新 store 中的播放器数据（封面、歌名等）
  const song = allSongs.value[idx];
  if (song) {
    store.playerData = {
      ...store.playerData,
      name: song.name || song.title || "未知曲目",
      artist: song.artist || "未知艺术家",
      cover: song.cover || song.pic || "",
    };
  }
};

// LRC 解析
const parseLrc = (text) => {
  if (!text) return [];
  const lines = text.split("\n");
  const result = [];
  const timeMap = new Map();
  const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;
  for (const line of lines) {
    const matches = [...line.matchAll(timeExp)];
    if (matches.length > 0) {
      const content = line.replace(timeExp, "").trim();
      if (content) {
        for (const match of matches) {
          let time = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          time += match[3] ? parseInt(match[3], 10) / (match[3].length === 3 ? 1000 : 100) : 0;
          if (!timeMap.has(time)) timeMap.set(time, []);
          timeMap.get(time).push(content);
        }
      }
    }
  }
  for (const [time, textLines] of timeMap.entries()) {
    result.push({ time, text: textLines.join("\n") });
  }
  result.sort((a, b) => a.time - b.time);
  return result;
};

// 加载歌词
const loadLyrics = async () => {
  const p = window.$player;
  if (!p) return;
  const song = allSongs.value[currentSongIdx.value];
  if (!song?.lrc) return;
  try {
    const res = await fetch(song.lrc);
    if (res.ok) {
      pillLyrics.value = parseLrc(await res.text());
    }
  } catch {}
};

// 封面切换：交叉淡入淡出
const showOldCover = ref(false);
let coverFadeTimer = null;
const hasCoverChanged = ref(false);
watch(
  () => store.playerData?.cover,
  (newCover, oldCover) => {
    if (newCover && oldCover && newCover !== oldCover) {
      prevCover.value = oldCover;
      showOldCover.value = true;
      hasCoverChanged.value = true;
      if (coverFadeTimer) clearTimeout(coverFadeTimer);
      coverFadeTimer = setTimeout(() => {
        showOldCover.value = false;
      }, 500);
    }
  },
);
watch(
  () => store.playState,
  (playing) => {
    if (playing) {
      hasPlayedOnce.value = true;
      loadLyrics();
    }
  },
);

// 同步歌词高亮
const syncLyric = () => {
  const p = window.$player;
  if (!p?.audio || !pillLyrics.value.length) return;
  const ct = p.audio.currentTime;
  let idx = -1;
  for (let i = 0; i < pillLyrics.value.length; i++) {
    if (ct >= pillLyrics.value[i].time) idx = i;
    else break;
  }
  pillLyricIdx.value = idx;
};

// 自动滚动到当前歌词行（面板收起时容器不存在，直接跳过）
const scrollToActiveLyric = () => {
  if (userScrolling.value) return;
  const container = lrcScrollRef.value;
  const el = container?.children[pillLyricIdx.value];
  if (!el) return;
  const offset = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
  container.scrollTo({ top: offset, behavior: "smooth" });
};

// 用户手动滚动时暂停跟随，停止滚动 3 秒后回到当前行
const pauseLyricFollow = () => {
  userScrolling.value = true;
  clearTimeout(followResumeTimer);
  followResumeTimer = setTimeout(() => {
    userScrolling.value = false;
    scrollToActiveLyric();
  }, 3000);
};

// 点击歌词跳转到对应时间点
const seekToLine = (idx) => {
  const line = pillLyrics.value[idx];
  if (!line) return;
  window.$player?.seek(line.time);
  pillLyricIdx.value = idx;
  clearTimeout(followResumeTimer);
  userScrolling.value = false;
  nextTick(scrollToActiveLyric);
};

// 歌词行高亮变化时跟随滚动
watch(pillLyricIdx, scrollToActiveLyric, { flush: "post" });

// 展开面板或切换到歌词页时立即定位到当前行
watch(
  () => [store.playerFolded, store.playerPanelTab],
  () => {
    if (store.playerFolded || store.playerPanelTab !== "lrc") return;
    scrollToActiveLyric();
  },
  { flush: "post" },
);

// 控制
const togglePlay = () => {
  window.$player?.toggle();
};
const prevSong = () => {
  window.$player?.skipBack();
  window.$player?.play();
};
const nextSong = () => {
  window.$player?.skipForward();
  window.$player?.play();
};
const playSongByIdx = (idx) => {
  window.$player?.list.switch(idx);
  window.$player?.play();
  syncFromPlayer();
  loadLyrics();
};

// 定时同步 + 监听切歌（暂停时也能捕获）
let timer = null;
let audioListeners = [];

// 页面滚动时自动折叠播放器面板，滚动到底部时收起胶囊
let scrollHandler = null;
let modalScrollHandler = null;
let lastScrollY = 0;
onMounted(() => {
  scrollHandler = () => {
    const st = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (!store.playerFolded) store.playerFolded = true;
    if (st >= maxScroll - 50) {
      pillStackHidden.value = true;
    } else if (st < lastScrollY) {
      pillStackHidden.value = false;
    }
    lastScrollY = st;
  };
  window.addEventListener("scroll", scrollHandler, { passive: true });

  // 监听移动端弹窗内部滚动
  let lastModalScrollTop = 0;
  modalScrollHandler = (e) => {
    const el = e.target;
    if (!el || !el.classList || !el.classList.contains("modal-content")) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (!store.playerFolded) store.playerFolded = true;
    if (atBottom) {
      pillStackHidden.value = true;
    } else if (el.scrollTop < lastModalScrollTop) {
      pillStackHidden.value = false;
    }
    lastModalScrollTop = el.scrollTop;
  };
  document.addEventListener("scroll", modalScrollHandler, { passive: true, capture: true });
});
onBeforeUnmount(() => {
  if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
  if (modalScrollHandler)
    document.removeEventListener("scroll", modalScrollHandler, { capture: true });
});
const attachAudioListeners = () => {
  const audio = window.$player?.audio;
  if (!audio || audio._pillBound) return;
  audio._pillBound = true;
  const onLoaded = () => {
    syncFromPlayer();
    loadLyrics();
  };
  const onEnded = () => {
    setTimeout(() => {
      syncFromPlayer();
      loadLyrics();
    }, 200);
  };
  audio.addEventListener("loadeddata", onLoaded);
  audio.addEventListener("ended", onEnded);
  audioListeners = [
    { el: audio, fn: onLoaded, evt: "loadeddata" },
    { el: audio, fn: onEnded, evt: "ended" },
  ];
};
onMounted(() => {
  syncFromPlayer();
  timer = setInterval(() => {
    syncFromPlayer();
    syncLyric();
  }, 500);
  attachAudioListeners();
  const retryTimer = setInterval(() => {
    if (window.$player?.audio) {
      attachAudioListeners();
      clearInterval(retryTimer);
    }
  }, 500);
  // 监听窗口大小变化
  const onResize = () => {
    isMobile.value = window.innerWidth <= 768;
  };
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (coverFadeTimer) clearTimeout(coverFadeTimer);
  if (followResumeTimer) clearTimeout(followResumeTimer);
  audioListeners.forEach(({ el, fn, evt }) => el.removeEventListener(evt, fn));
});
</script>

<style lang="scss" scoped>
// 三层堆叠容器
.pill-stack {
  position: fixed;
  bottom: 24px;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
  &.pill-hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
    pointer-events: none;
  }
  @media (max-width: 768px) {
    bottom: 16px;
    width: calc(100vw - 32px);
  }
}
.pill-layer {
  display: flex;
  justify-content: center;
  width: 100%;
}

// ---- 第一层：封面 + 歌词 ----
.pill-lyric {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 16px 0 6px;
  border-radius: 50px;
  background-color: var(--main-card-background);
  border: 1px solid var(--main-card-border);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition:
    border-color 0.3s,
    box-shadow 0.3s,
    width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform var(--press-out) var(--press-ease);
  &:hover {
    border-color: var(--main-color);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }
  &:active {
    transform: scale(0.97);
    transition-duration: var(--press-in);
  }
  @media (max-width: 768px) {
    padding: 0 12px 0 4px;
  }
  .pill-lyric-text {
    flex: 1;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--main-font-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    @media (max-width: 768px) {
      font-size: 13px;
    }
  }
  &.island-theme-color {
    background-color: var(--main-color);
    border-color: var(--main-color);
    .pill-lyric-text {
      color: #ffffff;
    }
    &:hover {
      border-color: var(--main-color);
      box-shadow: 0 4px 16px var(--main-color-bg);
    }
  }
}
.pill-lyric-cover-wrap {
  width: 32px;
  height: 32px;
  min-width: 32px;
  position: relative;
  &.cover-fading .cover-old-wrap {
    animation: cover-fade-out 0.5s ease forwards;
  }
  &.cover-fading .cover-new-wrap {
    animation: cover-fade-in 0.5s ease forwards;
  }
}
.cover-old-wrap,
.cover-new-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
}
@keyframes cover-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@keyframes cover-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.pill-lyric-cover {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  outline: 1px solid var(--main-card-border);
  &.spinning {
    animation: pill-rotate 20s linear infinite;
  }
}
.pill-lyric-text-inner {
  display: inline-block;
}

// 歌词文字切换动画
.pill-text-enter-active {
  transition: opacity 0.2s ease;
}
.pill-text-leave-active {
  transition: opacity 0.15s ease;
}
.pill-text-enter-from {
  opacity: 0;
}
.pill-text-leave-to {
  opacity: 0;
}
@keyframes pill-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// ---- 第二层：歌名 + 控制按钮 ----
.pill-ctrl-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 400px;
  max-width: 100%;
  padding: 6px 14px 6px 18px;
  border-radius: 999px;
  background-color: var(--main-card-background);
  border: 1px solid var(--main-card-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  box-sizing: border-box;
  &:hover {
    border-color: var(--main-color);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  @media (max-width: 768px) {
    width: 100%;
    padding: 4px 8px 4px 12px;
  }
}
.pill-ctrl-name {
  display: inline-flex;
  overflow: hidden;
  max-width: 160px;
  @media (max-width: 768px) {
    max-width: 100px;
  }
}
.pill-ctrl-name-inner {
  font-size: 14px;
  font-weight: 600;
  color: var(--main-font-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    font-size: 13px;
  }
}
.pill-ctrl-btns {
  display: flex;
  align-items: center;
  gap: 0;
}
.pill-ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--main-font-color);
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  padding: 0;
  &:hover {
    color: var(--main-color);
    background-color: var(--main-color-bg);
  }
  &:active {
    transform: scale(0.92);
    transition-duration: var(--press-in);
  }
  @media (max-width: 768px) {
    width: 38px;
    height: 38px;
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

// ---- 第三层：列表/歌词卡片 ----
.pill-card {
  width: 400px;
  max-height: 360px;
  border-radius: 20px;
  background-color: var(--main-card-background);
  border: 1px solid var(--main-card-border);
  box-shadow: 0 6px 16px -4px var(--main-dark-shadow);
  overflow: hidden;
  transition: border-color 0.3s;
  &:hover {
    border-color: var(--main-color);
  }
  @media (max-width: 768px) {
    width: 100%;
  }
}
.pill-card-header {
  display: flex;
  gap: 16px;
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--main-font-second-color);
  span {
    cursor: pointer;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
    transition:
      color 0.2s,
      border-color 0.2s,
      opacity 0.2s;
    &.active {
      color: var(--main-color);
      border-bottom-color: var(--main-color);
    }
    // 行内元素不支持 transform，用透明度做按下反馈
    &:active {
      opacity: 0.6;
      transition-duration: var(--press-in);
    }
  }
  @media (max-width: 768px) {
    padding: 8px 12px 6px;
    font-size: 13px;
  }
}
.pill-card-list {
  height: 300px;
  overflow-y: auto;
  padding: 0 8px 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
.pill-card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform var(--press-out) var(--press-ease);
  &:hover {
    background-color: var(--main-color-bg);
  }
  &:active {
    transform: scale(0.98);
    transition-duration: var(--press-in);
  }
  &.active .pill-card-item-name {
    color: var(--main-color);
    font-weight: 600;
  }
  @media (max-width: 768px) {
    padding: 6px 8px;
    gap: 8px;
  }
}
.pill-card-item-cover {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
}
.pill-card-item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  min-width: 0;
}
.pill-card-item-name {
  font-size: 13px;
  color: var(--main-font-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    font-size: 12px;
  }
}
.pill-card-item-artist {
  font-size: 11px;
  color: var(--main-font-second-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    font-size: 10px;
  }
}
.pill-card-lrc {
  height: 300px;
  overflow: hidden;
  padding: 0 16px 12px;
}
.pill-card-lrc-scroll {
  position: relative;
  height: 288px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
.pill-card-lrc-empty {
  height: 288px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--main-font-second-color);
  opacity: 0.6;
}
.pill-card-lrc-line {
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--main-font-second-color);
  text-align: center;
  cursor: pointer;
  transition:
    color 0.3s,
    font-weight 0.3s,
    transform var(--press-out) var(--press-ease);
  &:hover {
    color: var(--main-font-color);
  }
  &:active {
    transform: scale(0.98);
    transition-duration: var(--press-in);
  }
  &.active {
    color: var(--main-color);
    font-weight: 600;
  }
  @media (max-width: 768px) {
    padding: 4px 0;
    font-size: 12px;
  }
}

// ---- 动画 ----
// 展开/收起：从上方滑入
.pill-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pill-expand-leave-active {
  transition: all 0.2s ease-in;
}
.pill-expand-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
.pill-expand-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

// 封面/歌词淡入淡出
.pill-fade-enter-active,
.pill-fade-leave-active {
  transition: opacity 0.25s ease;
}
.pill-fade-enter-from {
  opacity: 0;
}
.pill-fade-leave-to {
  opacity: 0;
}
</style>
