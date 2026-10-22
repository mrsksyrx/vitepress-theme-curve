<!-- 全局消息 -->
<template>
  <Teleport to="body">
    <!-- 灵动模式 / 普通模式 -->
    <div
      v-if="!messageIsland || store.islandMode !== 'extended'"
      class="message-wrapper"
      :class="[messageIsland ? 'island' : store.messagePosition, messageShow ? 'show' : 'hide']"
      :style="{ '--duration': messageDuration + 'ms' }"
    >
      <span v-if="messageCard && !messageIsland" :class="['message-type', messageType]">
        {{
          {
            success: "成功 Success",
            warning: "警告 Warning",
            error: "错误 Error",
            info: "信息 Info",
          }[messageType]
        }}
      </span>
      <div
        :class="[
          'message',
          messageType,
          store.progressDirection,
          store.messagePosition,
          {
            always: messageAlways,
            card: messageCard,
            island: messageIsland,
            'island-theme-color': messageIsland && store.islandUseThemeColor,
          },
        ]"
        @click="closeMessage"
      >
        <div class="message-content">
          <span
            v-if="messageIsland && store.progressDirection !== 'disabled'"
            class="island-progress"
          >
            <svg viewBox="0 0 24 24" class="island-progress-ring" :key="messageKey">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke-width="2.5"
                class="progress-track"
              />
              <circle cx="12" cy="12" r="10" fill="none" stroke-width="2.5" class="progress-fill" />
            </svg>
          </span>
          <span v-if="messageHtml" class="text" v-html="messageContent"></span>
          <span v-else class="text">{{ messageContent || "默认消息内容" }}</span>
          <span
            v-if="messageIsland && islandChannelText"
            :class="['island-channel', islandChannelClass]"
            >{{ islandChannelText }}</span
          >
          <span v-if="messageClose" class="close">
            <i class="iconfont icon-close"></i>
          </span>
        </div>
      </div>
      <div
        v-if="messageCard && !messageIsland && store.progressDirection !== 'disabled'"
        :class="['message-progress', store.progressDirection]"
        :key="messageKey"
      >
        <div class="message-progress-bar" />
      </div>
    </div>
    <!-- 拓展模式 -->
    <div
      v-show="messageIsland && store.islandMode === 'extended' && islandWrapperShow"
      class="island-extended-wrapper"
      :class="{ show: islandWrapperShow }"
    >
      <TransitionGroup name="island-stack" tag="div" class="island-stack">
        <div
          v-for="msg in islandMessages.slice().reverse()"
          :key="msg.key"
          :class="[
            'message',
            msg.type,
            'island',
            'island-extended',
            { 'island-theme-color': store.islandUseThemeColor },
          ]"
          :style="{ '--duration': msg.duration + 'ms' }"
          @click="closeIslandMessage(msg.key)"
        >
          <div class="message-content">
            <span v-if="msg.html" class="text" v-html="msg.content"></span>
            <span v-else class="text">{{ msg.content }}</span>
          </div>
        </div>
      </TransitionGroup>
      <!-- 子药丸（跟随最下面一条消息） -->
      <Transition name="island-pills">
        <div v-if="islandMessages.length > 0" class="island-pills">
          <div
            :class="[
              'island-pill',
              bottomMessageType,
              { 'island-theme-color': store.islandUseThemeColor },
            ]"
          >
            <span
              v-if="store.progressDirection !== 'disabled'"
              class="island-progress pill-progress"
            >
              <svg viewBox="0 0 24 24" class="island-progress-ring">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke-width="2.5"
                  class="progress-track"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke-width="2.5"
                  class="progress-fill"
                  :style="{
                    strokeDashoffset:
                      62.83 - (62.83 * bottomMessageElapsed) / bottomMessageDuration,
                  }"
                />
              </svg>
            </span>
            <span class="pill-text">{{
              {
                success: "成功 Success",
                warning: "警告 Warning",
                error: "错误 Error",
                info: "信息 Info",
              }[bottomMessageType]
            }}</span>
          </div>
          <div :class="['island-pill', { 'island-theme-color': store.islandUseThemeColor }]">
            <template v-if="store.islandPlayerSupport && store.playState && store.playerShow">
              <span class="pill-text pill-music">
                <img
                  v-if="store.playerData?.cover"
                  :src="store.playerData.cover"
                  :class="['pill-music-cover', { spinning: store.playState }]"
                  alt=""
                />
                <span class="pill-music-info">
                  <span class="pill-music-name">{{ store.playerData?.name || "未知曲目" }}</span>
                </span>
              </span>
            </template>
            <template v-else>
              <span class="pill-text" v-if="store.islandShowDate">
                <span class="time-date">{{ currentDate }}</span
                >&nbsp;
                <span v-if="store.islandShowSeconds">
                  <span class="time-part">{{ currentHours }}</span
                  ><span class="time-separator">:</span
                  ><span class="time-part">{{ currentMinutes }}</span
                  ><span class="time-separator">:</span
                  ><span class="time-part time-seconds">{{ currentSeconds }}</span>
                </span>
                <span v-else>
                  <span class="time-part">{{ currentHours }}</span
                  ><span class="time-separator">:</span
                  ><span class="time-part">{{ currentMinutes }}</span>
                </span>
              </span>
              <span class="pill-text" v-else-if="store.islandShowSeconds">
                <span class="time-part">{{ currentHours }}</span
                ><span class="time-separator">:</span
                ><span class="time-part">{{ currentMinutes }}</span
                ><span class="time-separator">:</span
                ><span class="time-part time-seconds">{{ currentSeconds }}</span>
              </span>
              <span class="pill-text" v-else>
                <span class="time-part">{{ currentHours }}</span
                ><span class="time-separator">:</span
                ><span class="time-part">{{ currentMinutes }}</span>
              </span>
            </template>
          </div>
          <div :class="['island-pill', { 'island-theme-color': store.islandUseThemeColor }]">
            <span class="pill-text">
              <template v-if="store.devMode === 2">
                <span class="pill-prefix error">{{ pillText }}</span>
              </template>
              <template v-else>
                <span>sgexilq</span><span class="pill-domain">.com</span>
              </template>
            </span>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { mainStore } from "@/store";
import { useIsMobileLayout } from "@/utils/layout.js";

const store = mainStore();

// 根据页面布局决定默认消息样式
const isMobileLayout = useIsMobileLayout();

const useCardStyle = computed(() => {
  return store.messageStyle === "card";
});

const useIslandStyle = computed(() => {
  return store.messageStyle === "island";
});

// 消息数据
const messageType = ref("info");
const messageShow = ref(false);
const messageClose = ref(false);
const messageContent = ref(null);
const messageAlways = ref(false);
const messageDuration = ref(0);
const messageTimeOut = ref(null);
const messageCard = ref(false);
const messageIsland = ref(false);
const messageHtml = ref(false);
const messageKey = ref(0);
const currentTime = ref("");
const currentHours = ref("");
const currentMinutes = ref("");
const currentSeconds = ref("");
const currentDate = ref("");
let timeInterval = null;
let progressInterval = null;

// 药丸文本
const pillText = computed(() => {
  if (store.devMode === 2) return "开发模式";
  return "sgexilq.com";
});

// 灵动模式消息末尾的开发模式文本
const islandChannelText = computed(() => {
  if (store.devMode === 2) return "开发模式";
  return "";
});

// 灵动模式开发模式文本颜色类
const islandChannelClass = computed(() => {
  if (store.devMode === 2) return "channel-devmode";
  return "";
});

// 拓展模式消息数组
const islandMessages = ref([]);
const islandMessageTimeouts = ref({});
const islandWrapperShow = ref(false);
const islandWrapperHideTimeout = ref(null);
const progressUpdateKey = ref(0);

// 计算最下面一条消息的类型和key（数组第一条，因为显示是倒序）
const bottomMessageType = computed(() => {
  if (islandMessages.value.length === 0) return "info";
  return islandMessages.value[0].type;
});
const bottomMessageKey = computed(() => {
  if (islandMessages.value.length === 0) return 0;
  progressUpdateKey.value; // 触发重新计算
  return islandMessages.value[0].key;
});
const bottomMessageDuration = computed(() => {
  if (islandMessages.value.length === 0) return 0;
  return islandMessages.value[0].duration;
});
const bottomMessageElapsed = computed(() => {
  if (islandMessages.value.length === 0) return 0;
  progressUpdateKey.value; // 触发重新计算
  const msg = islandMessages.value[0];
  if (msg.always) return 0;
  return Math.min(Date.now() - msg.createdAt, msg.duration);
});

// 关闭拓展模式消息
const closeIslandMessage = (key) => {
  const index = islandMessages.value.findIndex((m) => m.key === key);
  if (index !== -1) {
    islandMessages.value.splice(index, 1);
    clearTimeout(islandMessageTimeouts.value[key]);
    delete islandMessageTimeouts.value[key];
    // 如果是最后一条消息，延迟关闭容器以播放动画
    if (islandMessages.value.length === 0) {
      // 清除之前的隐藏超时
      clearTimeout(islandWrapperHideTimeout.value);
      islandWrapperHideTimeout.value = setTimeout(() => {
        // 再次检查是否仍有消息（可能在延迟期间有新消息到达）
        if (islandMessages.value.length === 0) {
          islandWrapperShow.value = false;
        }
      }, 300);
    }
  }
};

// 消息处理
const showMessage = (text, type = "info", options = {}, func = null) => {
  // 解构配置
  const {
    close = false,
    always = false,
    duration = store.messageDuration,
    card = useCardStyle.value,
    island = useIslandStyle.value,
    html = false,
  } = options;

  // 清除之前的超时
  clearTimeout(messageTimeOut.value);

  // 拓展模式
  if (island && store.islandMode === "extended") {
    // 清除待执行的隐藏超时，防止新消息到达时容器被错误隐藏
    clearTimeout(islandWrapperHideTimeout.value);

    const newKey = Date.now();
    islandMessages.value.push({
      key: newKey,
      type,
      content: text,
      html,
      duration,
      close: close || duration === 0,
      always: always || duration === 0,
      createdAt: Date.now(),
    });
    messageShow.value = true;
    messageIsland.value = true;
    messageKey.value = newKey;
    // 延迟显示容器以触发动画
    nextTick(() => {
      islandWrapperShow.value = true;
    });

    // 自动关闭
    if (!always && duration > 0) {
      islandMessageTimeouts.value[newKey] = setTimeout(() => {
        closeIslandMessage(newKey);
        if (typeof func === "function") func();
      }, duration);
    }
  }
  // 灵动模式或卡片模式且当前有消息显示，快速切换
  else if ((island || card) && messageShow.value) {
    messageShow.value = false;
    setTimeout(() => {
      messageIsland.value = island;
      messageClose.value = card || island ? false : close || duration === 0;
      messageContent.value = text;
      messageType.value = type;
      messageAlways.value = always || duration === 0;
      messageDuration.value = duration;
      messageCard.value = card;
      messageHtml.value = html;
      messageKey.value++;
      messageShow.value = true;
      if (!always && duration > 0) {
        messageTimeOut.value = setTimeout(() => {
          messageShow.value = false;
          if (typeof func === "function") func();
        }, duration);
      }
    }, 150);
  }
  // 普通模式
  else {
    messageShow.value = false;
    nextTick().then(() => {
      messageIsland.value = island;
      messageClose.value = card || island ? false : close || duration === 0;
      messageContent.value = text;
      messageType.value = type;
      messageAlways.value = always || duration === 0;
      messageDuration.value = duration;
      messageCard.value = card;
      messageHtml.value = html;
      messageKey.value++;
      messageShow.value = true;
      if (!always && duration > 0) {
        messageTimeOut.value = setTimeout(() => {
          messageShow.value = false;
          if (typeof func === "function") func();
        }, duration);
      }
    });
  }
};

// 弹出消息
const message = {
  // 信息
  info: (text, options, func) => {
    showMessage(text, "info", options, func);
  },
  // 成功
  success: (text, options, func) => {
    showMessage(text, "success", options, func);
  },
  // 警告
  warning: (text, options, func) => {
    showMessage(text, "warning", options, func);
  },
  // 错误
  error: (text, options, func) => {
    showMessage(text, "error", options, func);
  },
};

// 关闭消息
const closeMessage = () => {
  messageShow.value = false;
  clearTimeout(messageTimeOut.value);
};

// 更新时间
const updateTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  currentTime.value = `${hours}:${minutes}:${seconds}`;
  currentHours.value = hours;
  currentMinutes.value = minutes;
  currentSeconds.value = seconds;
  currentDate.value = `${year}.${month}.${day}`;
};

onMounted(() => {
  // 挂载全局
  window.$message = message;
  // 启动时间更新
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  // 启动进度条更新（每帧更新）
  progressInterval = setInterval(() => {
    if (islandMessages.value.length > 0) {
      progressUpdateKey.value++;
    }
  }, 50);
});

onUnmounted(() => {
  clearInterval(timeInterval);
  clearInterval(progressInterval);
  clearTimeout(islandWrapperHideTimeout.value);
  clearTimeout(messageTimeOut.value);
  Object.values(islandMessageTimeouts.value).forEach(clearTimeout);
  islandMessageTimeouts.value = {};
  if (window.$message === message) delete window.$message;
});
</script>

<style lang="scss" scoped>
.message-wrapper {
  position: fixed;
  z-index: 3000;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  &.show {
    opacity: 1;
    pointer-events: auto;
  }
  &.left-bottom {
    bottom: 32px;
    left: 32px;
    transform: translateY(-10px);
    &.show {
      transform: translateY(0);
    }
  }
  &.left-top {
    top: 32px;
    left: 32px;
    transform: translateY(-10px);
    &.show {
      transform: translateY(0);
    }
  }
  &.right-bottom {
    bottom: 32px;
    right: 32px;
    transform: translateY(-10px);
    &.show {
      transform: translateY(0);
    }
  }
  &.right-top {
    top: 32px;
    right: 32px;
    transform: translateY(-10px);
    &.show {
      transform: translateY(0);
    }
  }
  &.bottom-center {
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    align-items: center;
    &.show {
      transform: translateX(-50%) translateY(0);
    }
  }
  &.top-center {
    top: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px);
    align-items: center;
    &.show {
      transform: translateX(-50%) translateY(0);
    }
  }
  // 超级岛样式
  &.island {
    top: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(-40px) scale(0.85);
    align-items: center;
    transition:
      opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    &.show {
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
}
.message {
  position: relative;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  width: 100%;
  width: 100vw;
  background-color: var(--main-color);
  z-index: 3000;
  transition: opacity var(--press-out) var(--press-ease);
  .message-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
    .text {
      color: var(--main-card-background);
    }
    .close {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-left: 12px;
      padding: 10px;
      border-radius: 50%;
      transition: background-color 0.3s;
      cursor: pointer;
      .iconfont {
        font-size: 14px;
        color: var(--main-card-background);
        opacity: 0.6;
        transition: opacity 0.3s;
      }
      &:hover {
        background-color: var(--main-color-white);
        .iconfont {
          opacity: 1;
        }
      }
    }
  }
  &.success {
    background-color: var(--main-success-color);
  }
  &.warning {
    background-color: var(--main-warning-color);
  }
  &.error {
    background-color: var(--main-error-color);
  }
  &.info {
    background-color: var(--main-info-color);
  }
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    z-index: -1;
    background-color: var(--main-color-white);
    transition: width 0.3s;
    animation: loading-width var(--duration) linear forwards;
  }
  &.always {
    &::after {
      width: 100%;
      animation: loading 1.5s infinite;
    }
  }
  &.reverse::after {
    animation-direction: reverse;
  }
  &.normal::after {
    animation-direction: normal;
  }
  &.decorative::after {
    width: 100%;
    animation: none;
  }
  &.disabled::after {
    display: none;
  }
  // 点击反馈：元素自身为 position: fixed，无法使用 transform
  &:active {
    opacity: 0.85;
    transition-duration: var(--press-in);
  }
  &.bar-bottom {
    top: auto;
    bottom: 0;
  }
  &.card {
    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    width: 28vw;
    max-width: 2400px;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 80px 20px;
    border-radius: 16px;
    background-color: var(--main-card-background);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background-color: var(--main-color);
    }
    &::after {
      display: none;
    }
    .message-content {
      font-size: clamp(14px, 1.3vw, 26px);
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
      .text {
        color: var(--main-text);
      }
      .close .iconfont {
        color: var(--main-text);
        font-size: clamp(12px, 0.9vw, 18px);
      }
    }
    .message-content .text {
      color: var(--main-color);
    }
    &.success::before {
      background-color: var(--main-success-color);
    }
    &.warning::before {
      background-color: var(--main-warning-color);
    }
    &.error::before {
      background-color: var(--main-error-color);
    }
    &.info::before {
      background-color: var(--main-info-color);
    }
    @media (max-width: 768px) {
      width: 85vw;
      padding: 16px 24px;
      border-radius: 12px;
      .message-content {
        font-size: 15px;
      }
    }
  }
  // 超级岛样式
  &.island {
    position: relative;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    width: auto;
    min-width: 200px;
    max-width: 400px;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 11px;
    border-radius: 50px;
    background-color: var(--main-card-background);
    border: 1px solid var(--main-card-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    overflow: visible;
    // 使用主题色
    &.island-theme-color {
      background-color: var(--main-color);
      border-color: var(--main-color);
      .message-content .text {
        color: #ffffff;
      }
      .message-content .island-channel {
        &.channel-devmode {
          color: rgba(245, 108, 108, 0.8);
        }
      }
      .message-content .close .iconfont {
        color: #ffffff;
      }
      .progress-track {
        stroke: rgba(255, 255, 255, 0.3) !important;
      }
      .progress-fill {
        stroke: #ffffff !important;
      }
    }
    &::before {
      display: none;
    }
    &::after {
      display: none;
    }
    .message-content {
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      .text {
        color: var(--main-font-color);
      }
      .island-channel {
        font-size: 14px;
        margin-left: -6px;
        &.channel-devmode {
          color: var(--main-error-color);
          font-weight: bold;
        }
      }
      .close .iconfont {
        color: var(--main-font-color);
        opacity: 0.6;
        font-size: 12px;
        &:hover {
          opacity: 1;
        }
      }
    }
    // 环形进度条
    &.success .progress-track {
      stroke: rgba(103, 194, 58, 0.2);
    }
    &.success .progress-fill {
      stroke: var(--main-success-color);
    }
    &.warning .progress-track {
      stroke: rgba(230, 162, 60, 0.2);
    }
    &.warning .progress-fill {
      stroke: var(--main-warning-color);
    }
    &.error .progress-track {
      stroke: rgba(245, 108, 108, 0.2);
    }
    &.error .progress-fill {
      stroke: var(--main-error-color);
    }
    &.info .progress-track {
      stroke: rgba(144, 147, 153, 0.2);
    }
    &.info .progress-fill {
      stroke: var(--main-info-color);
    }
    // 拓展模式
    &.island-extended {
      width: 700px;
      min-width: 700px;
      max-width: 700px;
      cursor: pointer;
      @media (max-width: 750px) {
        width: 90vw;
        min-width: 90vw;
        max-width: 90vw;
      }
    }
    @media (max-width: 768px) {
      min-width: 160px;
      max-width: 85vw;
      padding: 8px 12px;
      .message-content {
        font-size: 13px;
      }
    }
  }
}
// 超级岛子药丸
.island-pills {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
  position: relative;
  z-index: 1;
  @media (max-width: 768px) {
    gap: 6px;
    flex-wrap: wrap;
  }
  .island-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 50px;
    background-color: var(--main-card-background);
    border: 1px solid var(--main-card-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    .pill-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--main-font-color);
      white-space: nowrap;
      .pill-prefix {
        &.success {
          color: var(--main-success-color);
        }
        &.warning {
          color: var(--main-warning-color);
        }
        &.error {
          color: var(--main-error-color);
        }
        &.info {
          color: var(--main-info-color);
        }
      }
      .pill-domain {
        color: var(--main-color);
      }
      .time-separator,
      .time-seconds {
        color: var(--main-color);
      }
    }
    .pill-progress {
      width: 20px;
      height: 20px;
    }
    .pill-music {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill-music-cover {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      &.spinning {
        animation: pill-cover-rotate 8s linear infinite;
      }
    }
    @keyframes pill-cover-rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    .pill-music-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .pill-music-name {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
    @media (max-width: 768px) {
      padding: 8px 12px;
      .pill-text {
        font-size: 13px;
      }
    }
    // 消息类型颜色
    &.success .pill-text {
      color: var(--main-success-color);
    }
    &.warning .pill-text {
      color: var(--main-warning-color);
    }
    &.error .pill-text {
      color: var(--main-error-color);
    }
    &.info .pill-text {
      color: var(--main-info-color);
    }
    &.success .progress-fill {
      stroke: var(--main-success-color);
    }
    &.warning .progress-fill {
      stroke: var(--main-warning-color);
    }
    &.error .progress-fill {
      stroke: var(--main-error-color);
    }
    &.info .progress-fill {
      stroke: var(--main-info-color);
    }
    // 使用主题色
    &.island-theme-color {
      background-color: var(--main-color);
      border-color: var(--main-color);
      .pill-text {
        color: #ffffff;
        .pill-prefix {
          &.success {
            color: #ffffff;
          }
          &.warning {
            color: #ffffff;
          }
          &.error {
            color: #ffffff;
          }
          &.info {
            color: #ffffff;
          }
        }
        .pill-domain,
        .time-separator,
        .time-seconds {
          color: #ffffff;
        }
      }
    }
  }
}
// 超级岛子药丸动画
.island-pills-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.island-pills-leave-active {
  transition: all 0.25s ease-in;
}
.island-pills-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.9);
}
.island-pills-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
// 超级岛拓展模式容器
.island-extended-wrapper {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transform: translateX(-50%) translateY(-40px) scale(0.85);
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  &.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}
.island-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
// 超级岛堆叠动画
.island-stack-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.island-stack-leave-active {
  transition: all 0.25s ease-in;
  position: absolute;
}
.island-stack-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
.island-stack-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.island-stack-move {
  transition: transform 0.3s ease;
}
.message-type {
  margin-bottom: 8px;
  font-size: clamp(18px, 1.5vw, 27px);
  font-weight: 600;
  &.success {
    color: var(--main-success-color);
  }
  &.warning {
    color: var(--main-warning-color);
  }
  &.error {
    color: var(--main-error-color);
  }
  &.info {
    color: var(--main-info-color);
  }
}
.message-progress {
  margin-top: 16px;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--main-card-border);
  align-self: stretch;
  .message-progress-bar {
    height: 100%;
    border-radius: 4px;
    animation: loading-width var(--duration) linear forwards;
  }
  &.reverse .message-progress-bar {
    animation-direction: reverse;
  }
  &.decorative .message-progress-bar {
    width: 100%;
    animation: none;
  }
}
.message-progress-bar {
  background-color: var(--main-color);
}
.message-wrapper .message.always ~ .message-progress .message-progress-bar {
  animation: loading 1.5s infinite;
}

// 超级岛环形进度条
.island-progress {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.island-progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  .progress-track {
    stroke: var(--main-card-border);
  }
  .progress-fill {
    stroke: var(--main-font-color);
    stroke-dasharray: 62.83;
    stroke-dashoffset: 62.83;
    stroke-linecap: round;
    // 灵动模式使用动画
    animation: island-ring-progress var(--duration, 3000ms) linear forwards;
  }
}

// 拓展模式进度条（使用内联样式控制）
.island-pills .island-progress-ring .progress-fill {
  animation: none;
  transition: stroke-dashoffset 0.1s linear;
}

@keyframes island-ring-progress {
  from {
    stroke-dashoffset: 62.83;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
