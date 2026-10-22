<!-- 全局播放器 -->
<template>
  <div v-if="playerShow" class="player-wrapper">
    <!-- 播放列表面板 -->
    <Transition name="playlist">
      <div v-if="!isFolded" class="expanded-panel">
        <div class="playlist-header">
          <span :class="{ active: panelTab === 'list' }" @click="panelTab = 'list'">播放列表</span>
          <span :class="{ active: panelTab === 'lrc' }" @click="panelTab = 'lrc'">歌词</span>
        </div>
        <div v-show="panelTab === 'list'" class="playlist-list-wrap">
          <ul class="playlist-list">
            <li
              v-for="(song, idx) in allSongs"
              :key="song.id"
              :class="['playlist-item', { active: currentIdx === idx }]"
              @click="playSong(idx)"
            >
              <img class="playlist-cover" :src="song.cover" :alt="song.name" />
              <div class="playlist-info">
                <span class="playlist-name">{{ song.name }}</span>
                <span class="playlist-artist">{{ song.artist }}</span>
              </div>
            </li>
          </ul>
        </div>
        <div v-show="panelTab === 'lrc'" class="lyrics-panel" ref="lyricsPanelRef">
          <div
            v-if="currentLyrics.length"
            class="lyrics-scroll"
            ref="lyricsScrollRef"
            @wheel.passive="pauseLyricFollow"
            @touchmove.passive="pauseLyricFollow"
          >
            <div
              v-for="(line, idx) in currentLyrics"
              :key="idx"
              :class="['lyric-line', { active: idx === activeLyricIndex }]"
              @click="seekToLine(idx)"
            >
              {{ line.text }}
            </div>
          </div>
          <div v-else class="lyrics-empty">暂无歌词</div>
        </div>
      </div>
    </Transition>
    <!-- 控制栏 -->
    <div
      :class="[
        'player',
        {
          playing: playState,
          folded: isFolded,
          'suppress-hover': suppressHover,
          [`rotate-${rotatePhase}`]: rotatePhase,
        },
      ]"
    >
      <div class="player-capsule" @click="toggleFold">
        <div ref="playerDom" class="player-content" />
      </div>
      <button v-show="!isFolded" class="ctrl-btn" @click.stop="player?.skipBack()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>
      <button v-show="!isFolded" class="ctrl-btn" @click.stop="player?.toggle()">
        <svg v-if="!playState" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      </button>
      <button v-show="!isFolded" class="ctrl-btn" @click.stop="player?.skipForward()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 18 14.5 12 6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import { getMusicList } from "@/api";
import "aplayer/dist/APlayer.min.css";

const store = mainStore();
const { theme } = useData();
const { enable, url, id, server, type } = theme.value.music;
const {
  playerShow,
  playerAutoPlay,
  playerPlayMode,
  playerMusicSource,
  playerCustomIds,
  playerVolume,
  playState,
  playerData,
  playerLyric,
  playerFolded,
  playerPanelTab,
} = storeToRefs(store);

// APlayer
const player = ref(null);
const playerDom = ref(null);
const suppressHover = ref(false);
const rotateTimer = ref(null);
const hasPlayed = ref(false);
const allSongs = ref([]);
const currentIdx = ref(0);
const panelTab = playerPanelTab;
const lyricsPanelRef = ref(null);
const lyricsScrollRef = ref(null);
const currentLyrics = ref([]);
const activeLyricIndex = ref(-1);
const userScrolling = ref(false);
let followResumeTimer = null;
let disposed = false;

// 随机轮播
const rotatePhase = ref("");

const preloadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
};

const startRotate = () => {
  if (!player.value || hasPlayed.value) return;
  rotateTimer.value = setInterval(() => {
    if (!player.value || hasPlayed.value) {
      stopRotate();
      return;
    }
    rotatePhase.value = "out";
    setTimeout(async () => {
      if (!player.value || hasPlayed.value) return;
      const len = player.value.list.audios.length;
      const idx = Math.floor(Math.random() * len);
      // 预加载封面
      const cover = allSongs.value[idx]?.cover;
      if (cover) await preloadImage(cover);
      player.value.list.switch(idx);
      currentIdx.value = idx;
      getMusicData();
      rotatePhase.value = "";
    }, 300);
  }, 3000);
};

const stopRotate = () => {
  if (rotateTimer.value) {
    clearInterval(rotateTimer.value);
    rotateTimer.value = null;
  }
};

const isFolded = playerFolded;

const toggleFold = () => {
  isFolded.value = !isFolded.value;
  if (isFolded.value) {
    suppressHover.value = true;
    setTimeout(() => {
      suppressHover.value = false;
    }, 350);
  }
};

// 点击列表项播放
const playSong = (idx) => {
  if (!player.value) return;
  hasPlayed.value = true;
  stopRotate();
  player.value.list.switch(idx);
  player.value.play();
  currentIdx.value = idx;
  getMusicData();
};

// 获取播放列表
const getMusicListData = async () => {
  if (!enable) return false;
  // url 缺失时 new URL(url) 会抛 TypeError，直接跳过
  if (!url) return false;

  try {
    // 根据歌单来源决定使用哪个 ID
    const activeId =
      playerMusicSource.value === "custom" && playerCustomIds.value
        ? playerCustomIds.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : id;
    const musicList = await getMusicList(url, activeId, server, type);
    const apiOrigin = new URL(url).origin;
    const fullList = musicList.map((song) => ({
      ...song,
      pic: song.cover,
      url: song.url ? new URL(song.url, apiOrigin).href : undefined,
      lrc: song.lrc ? new URL(song.lrc, apiOrigin).href : undefined,
    }));
    allSongs.value = fullList;
    initAPlayer(fullList?.length ? fullList : []);
    loadCurrentLyrics();
  } catch (error) {
    console.error("获取播放列表出错：", error);
    initAPlayer([]);
  }
};

// 安全播放：兼容 APlayer 不返回 Promise 的情况
const safePlay = () => {
  if (!player.value) return;
  const result = player.value.play();
  if (result && typeof result.catch === "function") {
    result.catch(() => {});
  }
};

// Meting type=url 是 302 链，最终落到 http:// 网易 CDN，HTTPS 页面会按混合内容
// 拦截导致 net::ERR_FAILED。浏览器读不到跳转 Location（跨域无 CORS），
// 走同源 /api/music-url 在服务端解析成 https 直链再交给 <audio>。
const resolveCache = new Map();
const resolveAudioUrl = async (rawUrl) => {
  if (!rawUrl) return rawUrl;
  if (resolveCache.has(rawUrl)) return resolveCache.get(rawUrl);
  let resolved = String(rawUrl).replace(/^http:\/\//i, "https://");
  try {
    const res = await fetch(`/api/music-url?url=${encodeURIComponent(rawUrl)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) resolved = data.url;
    }
  } catch (e) {
    console.warn("解析音频直链失败，回退原始地址：", e);
  }
  resolveCache.set(rawUrl, resolved);
  return resolved;
};

// 用户交互后备：浏览器阻止自动播放时，等待用户首次交互后播放
let autoPlayInteractionHandler = null;
const tryAutoPlayOnInteraction = () => {
  if (!playerAutoPlay.value || hasPlayed.value) return;
  const handler = () => {
    safePlay();
    document.removeEventListener("click", handler);
    document.removeEventListener("keydown", handler);
    autoPlayInteractionHandler = null;
  };
  autoPlayInteractionHandler = handler;
  document.addEventListener("click", handler, { once: true });
  document.addEventListener("keydown", handler, { once: true });
};

// 初始化播放器
const initAPlayer = async (list) => {
  try {
    const playlistData = [...list];
    if (!playlistData?.length) return false;
    const module = await import("aplayer");
    const APlayer = module.default;
    // 先解析首曲，避免 APlayer 挂载后 audio.src 仍为空
    if (playlistData[0]?.url) await resolveAudioUrl(playlistData[0].url);
    // 卸载后 import/解析可能才完成，避免往空容器挂播放器
    if (disposed || !playerDom.value) return false;
    player.value = new APlayer({
      container: playerDom.value,
      volume: playerVolume.value,
      listFolded: true,
      order: playerPlayMode.value === "shuffle" ? "random" : "list",
      loop: playerPlayMode.value === "single" ? "one" : "all",
      // type: meting → customAudioType 异步解析出 https 直链后再挂到 audio 上
      audio: playlistData.map((song) => ({ ...song, type: "meting" })),
      customAudioType: {
        meting: (media, song) => {
          const targetUrl = song.url;
          resolveAudioUrl(targetUrl).then((resolved) => {
            // 解析期间可能已切歌，别把旧地址盖到当前 audio 上
            const nowUrl = player.value?.list?.audios?.[player.value.list.index]?.url;
            if (nowUrl !== targetUrl) return;
            const shouldPlay = !player.value?.paused;
            media.src = resolved;
            if (shouldPlay) {
              const p = media.play();
              if (p && typeof p.catch === "function") p.catch(() => {});
            }
          });
        },
      },
    });
    // APlayer setAudio 会在 customAudioType 异步设好 src 之前调 audio.play()，
    // 那次 play() 必然 reject，吞掉以免 unhandledrejection 刷屏
    if (player.value?.audio?.play) {
      const rawPlay = player.value.audio.play.bind(player.value.audio);
      player.value.audio.play = () => {
        const p = rawPlay();
        return p && typeof p.catch === "function" ? p.catch(() => {}) : p;
      };
    }
    // 同步单曲循环到底层 audio 元素
    if (playerPlayMode.value === "single" && player.value.audio) {
      player.value.audio.loop = true;
    }
    console.info("🎵 播放器挂载完成", player.value);
    player.value?.on("canplay", () => {
      getMusicData();
      // 绑定原生 audio 的 timeupdate 事件驱动歌词同步
      const audioEl = playerDom.value?.querySelector("audio") || player.value?.audio;
      if (audioEl && !audioEl._lrcBound) {
        audioEl._lrcBound = true;
        audioEl.addEventListener("timeupdate", () => {
          syncLyricsFromTime(audioEl.currentTime);
        });
      }
      if (playerAutoPlay.value && !hasPlayed.value) {
        safePlay();
      }
    });
    player.value?.on("play", () => {
      if (!hasPlayed.value) {
        hasPlayed.value = true;
        stopRotate();
      }
      playState.value = true;
      currentIdx.value = player.value.list.index;
    });
    player.value?.on("pause", () => {
      playState.value = false;
    });
    // APlayer 内置 error 处理器会在 2 秒后 skipForward + play，
    // 音频连续加载失败时会变成“整本歌单不停轮换”的死循环。这里做熔断。
    let consecutiveAudioErrors = 0;
    const originalSkipForward = player.value?.skipForward?.bind(player.value);
    player.value?.on("error", () => {
      consecutiveAudioErrors += 1;
      if (consecutiveAudioErrors >= 3 && originalSkipForward) {
        player.value.skipForward = () => {};
        player.value.pause?.();
        console.error("音频连续加载失败，已停止自动切歌");
      }
    });
    player.value?.on("playing", () => {
      consecutiveAudioErrors = 0;
      if (originalSkipForward) player.value.skipForward = originalSkipForward;
    });
    getMusicData();
    if (!playerAutoPlay.value) {
      startRotate();
    }
    window.$player = player.value;
  } catch (error) {
    console.error("初始化播放器出错：", error);
  }
};

// 获取当前播放歌曲信息
const getMusicData = () => {
  try {
    if (!playerDom.value) return false;
    const songInfo = playerDom.value.querySelector(".aplayer-info");
    const audio = player.value?.list?.audios?.[player.value.list.index];
    // songInfo 可能为 null（播放器 DOM 未就绪/已销毁），回退到 list.audios 元数据
    const songName = songInfo?.querySelector(".aplayer-title")?.innerText || audio?.name || "";
    const songArtist = (
      songInfo?.querySelector(".aplayer-author")?.innerText ||
      audio?.artist ||
      ""
    ).replace(" - ", "");
    const songCover = allSongs.value[currentIdx.value]?.cover || "";
    const songLrc = allSongs.value[currentIdx.value]?.lrc || "";
    playerData.value = {
      name: songName || "未知曲目",
      artist: songArtist || "未知艺术家",
      cover: songCover || audio?.cover || audio?.pic || "",
      lrc: songLrc,
    };
    initMediaSession(playerData.value?.name, playerData.value?.artist);
  } catch (error) {
    console.error("获取播放信息出错：", error);
  }
};

// 初始化媒体会话控制
const initMediaSession = (title, artist) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist });
    navigator.mediaSession.setActionHandler("play", () => {
      player.value?.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      player.value?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      player.value?.skipBack();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      player.value?.skipForward();
    });
  }
};

// 解析 LRC 歌词
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

// 加载当前歌曲歌词
const loadCurrentLyrics = async () => {
  currentLyrics.value = [];
  activeLyricIndex.value = -1;
  const song = allSongs.value[currentIdx.value];
  if (!song?.lrc) return;
  try {
    const res = await fetch(song.lrc);
    if (res.ok) {
      const text = await res.text();
      currentLyrics.value = parseLrc(text);
    }
  } catch (e) {
    console.warn("Failed to load lyrics", e);
  }
};

// 自动滚动到当前歌词行（面板收起时容器不存在，直接跳过）
const scrollToActiveLyric = () => {
  if (userScrolling.value) return;
  const container = lyricsScrollRef.value;
  const el = container?.children[activeLyricIndex.value];
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
  const line = currentLyrics.value[idx];
  if (!line) return;
  player.value?.seek(line.time);
  activeLyricIndex.value = idx;
  playerLyric.value = line.text;
  clearTimeout(followResumeTimer);
  userScrolling.value = false;
  nextTick(scrollToActiveLyric);
};

// 同步歌词高亮（由 initAPlayer 中的 timeupdate 事件驱动）
const syncLyricsFromTime = (ct) => {
  if (!currentLyrics.value.length) return;
  let idx = -1;
  for (let i = 0; i < currentLyrics.value.length; i++) {
    if (ct >= currentLyrics.value[i].time) idx = i;
    else break;
  }
  if (idx !== activeLyricIndex.value) {
    activeLyricIndex.value = idx;
    playerLyric.value = idx >= 0 ? currentLyrics.value[idx].text : "";
    nextTick(scrollToActiveLyric);
  }
};

// 切换歌曲时加载歌词
watch(currentIdx, () => {
  loadCurrentLyrics();
});

// 监听播放器开启状态
watch(
  () => playerShow.value,
  (val) => {
    if (!val) return false;
    currentLyrics.value = [];
    activeLyricIndex.value = -1;
    player.value?.destroy();
    // 清理：destroy 后置空 player 并停止轮播定时器，避免悬空引用与残留 interval
    player.value = null;
    stopRotate();
    getMusicListData();
  },
);

// 监听自动播放开关，播放器就绪时立即播放
watch(
  () => playerAutoPlay.value,
  (val) => {
    if (val && player.value && !hasPlayed.value) {
      nextTick(() => {
        safePlay();
      });
    }
  },
);

// 监听播放模式变化，动态切换
watch(
  () => playerPlayMode.value,
  (val) => {
    if (!player.value) return;
    // 播放顺序
    player.value.options.order = val === "shuffle" ? "random" : "list";
    // 循环模式
    const loopMode = val === "single" ? "one" : "all";
    player.value.options.loop = loopMode;
    // 同步到底层 audio 元素
    if (player.value.audio) {
      player.value.audio.loop = loopMode === "one";
    }
  },
);

// 监听播放器音量变化
watch(
  () => playerVolume.value,
  (val) => {
    player.value?.volume(val, true);
  },
);

// 监听歌单来源或自定义 ID 变化，防抖后清空并重新加载歌单
let musicSourceTimer = null;
watch(
  () => playerMusicSource.value,
  () => {
    if (!playerShow.value) return;
    clearTimeout(musicSourceTimer);
    musicSourceTimer = setTimeout(() => {
      if (playerMusicSource.value === "custom" && !playerCustomIds.value) return;
      player.value?.destroy();
      // 清理：destroy 后置空 player 并停止轮播定时器，避免悬空引用与残留 interval
      player.value = null;
      stopRotate();
      allSongs.value = [];
      hasPlayed.value = false;
      playState.value = false;
      getMusicListData();
    }, 300);
  },
);

// 监听自定义 ID 确认变化
watch(
  () => playerCustomIds.value,
  (val) => {
    if (!playerShow.value || playerMusicSource.value !== "custom" || !val) return;
    clearTimeout(musicSourceTimer);
    musicSourceTimer = setTimeout(() => {
      player.value?.destroy();
      // 清理：destroy 后置空 player 并停止轮播定时器，避免悬空引用与残留 interval
      player.value = null;
      stopRotate();
      allSongs.value = [];
      hasPlayed.value = false;
      playState.value = false;
      getMusicListData();
    }, 300);
  },
);

// 监听播放状态，直接控制封面旋转动画
watch(
  () => playState.value,
  (playing) => {
    nextTick(() => {
      const pic = playerDom.value?.querySelector(".aplayer-pic");
      if (pic) {
        pic.style.setProperty("animation-play-state", playing ? "running" : "paused", "important");
      }
    });
  },
);

onMounted(() => {
  if (playerShow.value) getMusicListData();
  if (playerAutoPlay.value) {
    tryAutoPlayOnInteraction();
  }
});

onBeforeUnmount(() => {
  disposed = true;
  stopRotate();
  clearTimeout(followResumeTimer);
  clearTimeout(musicSourceTimer);
  if (autoPlayInteractionHandler) {
    document.removeEventListener("click", autoPlayInteractionHandler);
    document.removeEventListener("keydown", autoPlayInteractionHandler);
    autoPlayInteractionHandler = null;
  }
  player.value?.destroy();
  // 清理：destroy 后置空 player（stopRotate 已在上方调用）
  player.value = null;
});
</script>

<style lang="scss" scoped>
.player-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
  @media (max-width: 768px) {
    display: none;
  }
}

// 播放列表面板
.expanded-panel {
  width: 400px;
  max-height: 400px;
  border-radius: 25px;
  background-color: var(--main-card-background);
  border: 1px solid var(--main-card-border);
  box-shadow: 0 6px 16px -4px var(--main-dark-shadow);
  transition: border-color 0.3s;
  overflow: hidden;
  &:hover {
    border-color: var(--main-accent);
  }
  margin-bottom: 12px;
}
.playlist-enter-active,
.playlist-leave-active {
  transition: all 0.3s ease;
}
.playlist-enter-from,
.playlist-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
.playlist-header {
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
      transform var(--press-out) var(--press-ease);
    &.active {
      color: var(--main-color);
      border-bottom-color: var(--main-color);
    }
    &:active {
      transform: scale(0.95);
      transition-duration: var(--press-in);
    }
  }
}
.playlist-list-wrap {
  overflow-y: auto;
  max-height: 340px;
}
.playlist-list {
  list-style: none;
  margin: 0;
  padding: 4px 4px 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
.lyrics-panel {
  padding: 8px 16px 12px;
  max-height: 340px;
  overflow: hidden;
}
.lyrics-scroll {
  position: relative;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
.lyric-line {
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--main-font-second-color);
  text-align: center;
  cursor: pointer;
  transition:
    color 0.3s,
    font-size 0.3s,
    font-weight 0.3s,
    transform var(--press-out) var(--press-ease);
  white-space: pre-wrap;
  word-break: break-word;
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
    font-size: 14px;
  }
}
.lyrics-empty {
  text-align: center;
  font-size: 13px;
  color: var(--main-font-second-color);
  opacity: 0.6;
  padding: 24px 0;
}
.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform var(--press-out) var(--press-ease);
  &:hover {
    background-color: var(--main-color-light);
  }
  &:active {
    transform: scale(0.98);
    transition-duration: var(--press-in);
  }
  &.active {
    background-color: var(--main-color-light);
    .playlist-name {
      color: var(--main-color);
    }
  }
}
.playlist-cover {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.playlist-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.playlist-name {
  font-size: 13px;
  color: var(--main-font-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}
.playlist-artist {
  font-size: 11px;
  color: var(--main-font-color);
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 控制栏
.player {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  transition: transform 0.3s;
  &:active {
    transform: scale(0.98);
    transition-duration: var(--press-in);
  }
}

// 胶囊（展开/折叠）
.player-capsule {
  position: relative;
  height: 44px;
  cursor: pointer;
  transition: transform var(--press-out) var(--press-ease);
  &:active {
    transform: scale(0.95);
    transition-duration: var(--press-in);
  }
  .player-content {
    position: relative;
    margin: 0;
    width: fit-content;
    border-radius: 50px;
    overflow: hidden;
    color: var(--main-font-color);
    font-family: var(--main-font-family);
    background-color: var(--main-card-background);
    border: 1px solid var(--main-card-border);
    box-shadow: 0 6px 10px -4px var(--main-dark-shadow);
    transition: all 0.3s;
    :deep(.aplayer-body) {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 6px;
      padding-right: 12px;
      pointer-events: none;
      transition: all 0.3s;
      .aplayer-pic {
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 50%;
        margin-right: 8px;
        outline: 1px solid var(--main-card-border);
        animation-name: rotate;
        animation-duration: 20s;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        animation-play-state: paused;
        z-index: 2;
        transition:
          margin 0.3s,
          opacity 0.3s;
        .aplayer-button {
          display: none;
        }
      }
      .aplayer-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        height: auto;
        margin: 0;
        padding: 0;
        border: none;
        transition: all 0.3s;
        .aplayer-music {
          margin: 0;
          padding: 0;
          height: auto;
          display: flex;
          line-height: normal;
          z-index: 2;
          transition: opacity 0.3s;
          .aplayer-title {
            line-height: normal;
            display: inline-block;
            white-space: nowrap;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .aplayer-author {
            display: none;
          }
        }
        .aplayer-lrc {
          margin: 0 !important;
          opacity: 0 !important;
          width: 0 !important;
          margin-left: 0 !important;
          z-index: 2;
          transition: none;
          &::after {
            display: none;
          }
          .aplayer-lrc-contents {
            display: none;
          }
        }
        .aplayer-controller {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          .aplayer-time {
            display: none;
          }
          .aplayer-bar-wrap {
            margin: 0;
            padding: 0;
            opacity: 0;
            transition: opacity 0.3s;
            .aplayer-bar {
              height: 100%;
              background: transparent;
              .aplayer-loaded {
                display: none;
              }
              .aplayer-played {
                height: 100%;
                background: var(--main-color-white) !important;
                transition: width 0.3s;
              }
            }
          }
        }
      }
      .aplayer-notice,
      .aplayer-miniswitcher {
        display: none;
      }
    }
    :deep(.aplayer-list) {
      display: none;
    }
    &::after {
      content: "折叠";
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 16px;
      opacity: 0;
      color: var(--main-card-background);
      background-color: var(--main-color);
      pointer-events: none;
      transition: opacity 0.3s;
      z-index: 3;
      border-radius: 50px;
    }
    &:hover::after {
      opacity: 1;
    }
  }
  // 播放中
  &.playing .player-content {
    color: var(--main-card-background);
    background-color: var(--main-color);
    border: 1px solid var(--main-color);
    &:hover::after {
      opacity: 0;
    }
    :deep(.aplayer-body) {
      .aplayer-pic {
        animation-play-state: running !important;
      }
      .aplayer-info {
        .aplayer-lrc {
          opacity: 0 !important;
          width: 0 !important;
        }
        .aplayer-controller {
          .aplayer-bar-wrap {
            opacity: 1;
          }
        }
      }
    }
  }
}

// 轮播切换动画：淡出
.player.rotate-out .player-capsule .player-content :deep(.aplayer-body) {
  .aplayer-pic {
    opacity: 0;
    animation-play-state: paused !important;
  }
  .aplayer-info .aplayer-music {
    opacity: 0;
  }
}

// 折叠状态：隐藏文字，只保留封面
.player.folded .player-capsule .player-content {
  :deep(.aplayer-body) {
    padding-right: 6px;
    .aplayer-pic {
      margin-right: 0;
    }
    .aplayer-info {
      width: 0;
      opacity: 0;
      overflow: hidden;
      transition: all 0.3s;
    }
  }
  &::after {
    content: "展开";
  }
  &:hover {
    :deep(.aplayer-body) {
      padding-right: 12px;
      .aplayer-pic {
        margin-right: 8px;
      }
      .aplayer-info {
        width: 42px;
        opacity: 1;
      }
    }
  }
}
// 展开（非折叠）状态
.player:not(.folded) .player-capsule .player-content {
  :deep(.aplayer-body) .aplayer-info {
    width: 120px;
    opacity: 1;
  }
}
// 抑制 hover 展开（点击折叠瞬间）
.player.suppress-hover .player-capsule {
  pointer-events: none;
}

// 控制按钮
.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--main-card-border);
  background-color: var(--main-card-background);
  color: var(--main-font-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 10px -4px var(--main-dark-shadow);
  transition: all 0.3s;
  flex-shrink: 0;
  padding: 0;
  &:hover {
    border-color: var(--main-color);
    color: var(--main-color);
    box-shadow: 0 8px 16px -4px var(--main-color-bg);
  }
  &:active {
    transform: scale(0.92);
    transition-duration: var(--press-in);
  }
}
</style>
