<!-- 移动端小组件浮层：遮罩 + 侧边栏小组件（动画与设置面板 Modal 一致） -->
<template>
  <Teleport to="body">
    <!-- v-if：关闭时卸载，避免天气定位 / 热榜接口在进站时白跑 -->
    <!-- gestureClosing：手势已手动滑出，关掉 CSS leave，避免再从原位播一次闪现 -->
    <Transition name="fade" :css="!gestureClosing">
      <div v-if="store.mobileWidgetsShow" class="mobile-widgets">
        <!-- 遮罩：点击关闭 -->
        <div ref="widgetsMaskEl" class="widgets-mask" @click="closePanel" />
        <div
          ref="widgetsPanelEl"
          class="widgets-panel s-card"
          @click.stop
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- 移动端下滑把手 -->
          <div class="panel-drag-handle">
            <div class="drag-bar" />
          </div>
          <!-- 顶部：标题 + 关闭 -->
          <div class="panel-top">
            <span class="panel-title">
              <i class="iconfont icon-window"></i>
              小组件
            </span>
            <div class="close-btn" @click="closePanel">
              <i class="iconfont icon-close"></i>
            </div>
          </div>
          <!-- 小组件列表：数据类在上，时间类沉底 -->
          <div ref="widgetsBodyEl" class="widgets-body">
            <Weather
              v-if="theme.aside?.weather?.enable && store.weatherWidgetEnabled"
              class="panel-widget"
              force-fetch
              @fetch-error="onWeatherError"
            />
            <HelloGithubHot
              v-if="theme.aside?.HelloGithub?.enable && store.helloGithubWidgetEnabled"
              class="panel-widget"
              show-on-mobile
              expand-all
              @fetch-error="onHotError"
            />
            <Tags
              v-if="theme.aside?.tags?.enable && store.tagsWidgetEnabled"
              class="panel-widget"
              expand-all
            />
            <SiteData v-if="theme.aside?.siteData?.enable" class="panel-widget" />
            <Countdown v-if="theme.aside?.countDown?.enable" class="panel-widget" />
            <Timing v-if="theme.aside?.timing?.enable" class="panel-widget" />
            <div v-if="!hasAnyWidget" class="empty-tip">暂无已启用的小组件</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { mainStore } from "@/store";
import Weather from "@/components/Aside/Widgets/Weather.vue";
import Countdown from "@/components/Aside/Widgets/Countdown.vue";
import Timing from "@/components/Aside/Widgets/Timing.vue";
import HelloGithubHot from "@/components/Aside/Widgets/HelloGithubHot.vue";
import Tags from "@/components/Aside/Widgets/Tags.vue";
import SiteData from "@/components/Aside/Widgets/SiteData.vue";

const store = mainStore();
const { theme } = useData();

const closePanel = () => store.changeShowStatus("mobileWidgetsShow");

// 手势关闭中：跳过 Transition 的 leave 动画（面板已被手动滑出）
const gestureClosing = ref(false);

// 重新打开时复位，保证下次进场动画正常
watch(
  () => store.mobileWidgetsShow,
  (val) => {
    if (val) gestureClosing.value = false;
  },
);

// 天气获取失败时关掉开关（与 Aside 一致）
const onWeatherError = (err) => {
  console.error("天气组件获取失败：", err);
  store.weatherWidgetEnabled = false;
};

// 热榜失败时关掉开关（浮层内不再用本地 showHot，避免下次打开仍是空壳）
const onHotError = (err) => {
  console.error("HelloGithub 热榜获取失败：", err);
  store.helloGithubWidgetEnabled = false;
};

const hasAnyWidget = computed(() => {
  const aside = theme.value.aside || {};
  return Boolean(
    (aside.weather?.enable && store.weatherWidgetEnabled) ||
      aside.countDown?.enable ||
      aside.timing?.enable ||
      (aside.HelloGithub?.enable && store.helloGithubWidgetEnabled) ||
      (aside.tags?.enable && store.tagsWidgetEnabled) ||
      aside.siteData?.enable,
  );
});

// 移动端下滑手势（与 Modal 一致）
const widgetsPanelEl = ref(null);
const widgetsMaskEl = ref(null);
const widgetsBodyEl = ref(null);

let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;
let startTime = 0;

const onTouchStart = (e) => {
  // 列表已滚动时不接管手势，交给内部滚动
  const body = widgetsBodyEl.value;
  if (body && body.scrollTop > 0) {
    isDragging = false;
    return;
  }
  touchStartY = e.touches[0].clientY;
  startTime = Date.now();
  isDragging = true;
};

const onTouchMove = (e) => {
  if (!isDragging) return;
  touchCurrentY = e.touches[0].clientY;
  const diff = Math.max(0, touchCurrentY - touchStartY);
  const panel = widgetsPanelEl.value;
  if (panel) {
    const progress = Math.min(diff / 300, 1);
    const scale = 1 - progress * 0.05;
    const opacity = 1 - progress * 0.3;
    panel.style.transform = `translateY(${diff}px) scale(${scale})`;
    panel.style.transition = "none";
    panel.style.opacity = opacity;
    const mask = widgetsMaskEl.value;
    if (mask) {
      mask.style.opacity = opacity;
    }
  }
};

const onTouchEnd = () => {
  if (!isDragging) return;
  const diff = touchCurrentY - touchStartY;
  const elapsed = Date.now() - startTime;
  const velocity = diff / elapsed;
  const panel = widgetsPanelEl.value;
  const mask = widgetsMaskEl.value;
  const shouldClose = diff > 80 || velocity > 0.5;

  if (shouldClose) {
    // 先标记再关闭：leave 阶段不再叠加 slide-down
    gestureClosing.value = true;
    if (panel) {
      panel.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
      panel.style.transform = "translateY(100vh) scale(0.95)";
      panel.style.opacity = "0";
    }
    if (mask) {
      mask.style.transition = "opacity 0.3s ease-out";
      mask.style.opacity = "0";
    }
    setTimeout(() => {
      // 不清 inline 样式：元素即将卸载，清掉反而会闪回原位
      closePanel();
    }, 300);
  } else {
    if (panel) {
      panel.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
      panel.style.transform = "";
      panel.style.opacity = "";
    }
    if (mask) {
      mask.style.transition = "opacity 0.25s ease-out";
      mask.style.opacity = "";
    }
    setTimeout(() => {
      if (panel) {
        panel.style.transition = "";
      }
      if (mask) {
        mask.style.transition = "";
      }
    }, 250);
  }
  touchStartY = 0;
  touchCurrentY = 0;
  isDragging = false;
};
</script>

<style lang="scss" scoped>
.mobile-widgets {
  position: fixed;
  inset: 0;
  z-index: 3000;

  .widgets-mask {
    position: absolute;
    inset: 0;
    background-color: var(--main-mask-background);
  }

  // 与设置面板（Modal .modal-mobile）同高：几乎全屏的底部弹层
  .widgets-panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
    display: flex;
    flex-direction: column;
    border-radius: 20px 20px 0 0;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
    overflow: hidden;

    .panel-drag-handle {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 0 8px;
      cursor: grab;
      touch-action: none;
      .drag-bar {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background-color: var(--main-card-border);
      }
    }

    .panel-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-shrink: 0;

      .panel-title {
        display: flex;
        align-items: center;
        font-weight: bold;
        font-size: 15px;
        .iconfont {
          margin-right: 6px;
          font-size: 18px;
          opacity: 0.75;
        }
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.3s;
        .iconfont {
          font-size: 16px;
          color: var(--main-font-second-color);
        }
        &:hover,
        &:active {
          background-color: var(--main-color);
          .iconfont {
            color: var(--main-card-background);
          }
        }
      }
    }

    .widgets-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      margin: 0 -4px;
      padding: 0 4px;

      .panel-widget {
        margin-bottom: 12px;
        padding: 14px;
        // 热榜组件自带 margin-bottom: 1rem，浮层里压回统一节奏
        :deep(.site-data) {
          margin-bottom: 0;
        }
        &:last-child {
          margin-bottom: 0;
        }
        // 覆盖组件内部可能自带的 s-card 内边距差异
        :deep(.title) {
          margin-bottom: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          opacity: 0.75;
          .iconfont {
            opacity: 0.6;
            margin-right: 6px;
          }
          .title-name {
            opacity: 0.8;
          }
        }
      }

      .empty-tip {
        text-align: center;
        padding: 24px 0;
        color: var(--main-font-second-color);
        font-size: 14px;
        opacity: 0.7;
      }
    }
  }
}

// 与设置面板（Modal 移动端）一致：遮罩淡入淡出，面板底部滑入滑出
// Transition 类加在 .mobile-widgets 上，面板动画需用后代选择器
.mobile-widgets.fade-enter-active .widgets-panel {
  animation: widgets-slide-up 0.3s ease-out forwards;
}
.mobile-widgets.fade-leave-active .widgets-panel {
  animation: widgets-slide-down 0.3s ease-in forwards;
}
@keyframes widgets-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes widgets-slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
