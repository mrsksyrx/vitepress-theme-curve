<!-- 弹窗组件 -->
<template>
  <Teleport to="body">
    <!-- gestureClosing：手势已手动滑出，用 CSS 跳过 leave，避免再从原位播一次闪现 -->
    <!-- persistent：内容常驻（v-show），避免每次打开重新挂载重依赖（如搜索 InstantSearch） -->
    <Transition name="fade">
      <div
        v-if="persistent || show"
        v-show="persistent ? show : true"
        :class="[
          'modal',
          {
            'modal-wrapper-mobile': isMobileLayout,
            'gesture-closing': gestureClosing,
            'modal-elevated': elevated,
          },
        ]"
      >
        <div ref="modalMaskEl" class="modal-mask" @click.stop="maskClick" />
        <div
          ref="modalMainEl"
          :style="{
            maxWidth: typeof maxWidth === 'string' ? maxWidth : `${maxWidth}px`,
          }"
          :class="['modal-main', 's-card', { 'modal-mobile': isMobileLayout }]"
          @click.stop
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <!-- 移动端下滑把手 -->
          <div class="modal-drag-handle">
            <div class="drag-bar" />
          </div>
          <!-- 标题 -->
          <div v-if="title" class="title">
            <div class="title-left">
              <i v-if="titleIcon" :class="`iconfont icon-${titleIcon}`"></i>
              <span class="title-text">{{ title }}</span>
            </div>
            <!-- 关闭按钮 -->
            <i v-if="showClose" class="iconfont icon-close close" @click="modalClose" />
            <!-- 移动端返回按钮 -->
            <i class="iconfont icon-left back" @click="modalClose" />
          </div>
          <!-- 弹窗内容 -->
          <div ref="modalContentEl" class="modal-content" :style="{ '--height': maxHeight + 'vh' }">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useIsMobileLayout } from "@/utils/layout.js";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/commonTools.mjs";

const isMobileLayout = useIsMobileLayout();

const props = defineProps({
  // 是否显示
  show: {
    type: Boolean,
    default: false,
  },
  // 标题
  title: {
    type: String,
    default: "",
  },
  // 标题图标
  titleIcon: {
    type: String,
    default: "",
  },
  // 是否显示关闭按钮
  showClose: {
    type: Boolean,
    default: true,
  },
  // 最大宽度
  maxWidth: {
    type: [Number, String],
    default: 800,
  },
  // 最大高度
  maxHeight: {
    type: Number,
    default: 80,
  },
  // 内容常驻：关闭时只隐藏不卸载，适合搜索等重依赖，避免每次打开卡一下
  persistent: {
    type: Boolean,
    default: false,
  },
  // 提到 --z-elevated：需压过播放器（--z-player）时开启，如分享面板
  elevated: {
    type: Boolean,
    default: false,
  },
});

// 发射事件
const emit = defineEmits(["mask-click", "modal-close"]);

// 模板 ref（多 Modal 并存时手势只作用于本实例）
const modalContentEl = ref(null);
const modalMainEl = ref(null);
const modalMaskEl = ref(null);

// 遮罩层事件
const maskClick = () => emit("mask-click");
const modalClose = () => emit("modal-close");

// 移动端下滑手势
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;
let startTime = 0;
// 手势关闭中：CSS 跳过 leave 动画（面板已被手动滑出）
const gestureClosing = ref(false);

const clearDragStyles = () => {
  if (modalMainEl.value) {
    modalMainEl.value.style.transform = "";
    modalMainEl.value.style.transition = "";
    modalMainEl.value.style.opacity = "";
  }
  if (modalMaskEl.value) {
    modalMaskEl.value.style.opacity = "";
    modalMaskEl.value.style.transition = "";
  }
};

// 重新打开时复位：清掉手势 inline 样式，保证下次进场动画正常
watch(
  () => props.show,
  (val) => {
    if (!val) return;
    gestureClosing.value = false;
    clearDragStyles();
  },
);

const onTouchStart = (e) => {
  const modalContent = modalContentEl.value;
  if (modalContent && modalContent.scrollTop > 0) {
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
  const modalMain = modalMainEl.value;
  if (modalMain) {
    const progress = Math.min(diff / 300, 1);
    const scale = 1 - progress * 0.05;
    const opacity = 1 - progress * 0.3;
    modalMain.style.transform = `translateY(${diff}px) scale(${scale})`;
    modalMain.style.transition = "none";
    modalMain.style.opacity = opacity;
    const mask = modalMaskEl.value;
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
  const modalMain = modalMainEl.value;
  const mask = modalMaskEl.value;
  const shouldClose = diff > 80 || velocity > 0.5;

  if (shouldClose) {
    // 标记后关闭：leave 阶段不再叠加 slide-down
    gestureClosing.value = true;
    if (modalMain) {
      modalMain.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
      modalMain.style.transform = "translateY(100vh) scale(0.95)";
      modalMain.style.opacity = "0";
    }
    if (mask) {
      mask.style.transition = "opacity 0.3s ease-out";
      mask.style.opacity = "0";
    }
    setTimeout(() => {
      modalClose();
    }, 300);
  } else {
    if (modalMain) {
      modalMain.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
      modalMain.style.transform = "";
      modalMain.style.opacity = "";
    }
    if (mask) {
      mask.style.transition = "opacity 0.25s ease-out";
      mask.style.opacity = "";
    }
    setTimeout(() => {
      if (modalMain) modalMain.style.transition = "";
      if (mask) mask.style.transition = "";
    }, 250);
  }
  touchStartY = 0;
  touchCurrentY = 0;
  isDragging = false;
};

// 监听开启（引用计数，多弹窗并发时不会互相踩踏）
watch(
  () => props.show,
  (val, oldVal) => {
    if (val === oldVal) return;
    if (val) lockBodyScroll();
    else if (oldVal) unlockBodyScroll();
  },
  { immediate: true },
);
onUnmounted(() => {
  if (props.show) unlockBodyScroll();
});
</script>

<style lang="scss" scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  z-index: var(--z-player);
  &.modal-elevated {
    z-index: var(--z-elevated);
  }
  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-color: var(--main-mask-background);
  }
  .modal-drag-handle {
    display: none;
  }
  .back {
    display: none;
  }
  .modal-main {
    position: absolute;
    padding: 0;
    animation: fade-up 0.5s forwards;
    width: calc(100% - 40px);
    overflow: hidden;
    .title {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      padding: 20px;
      height: 64px;
      background-color: var(--main-card-background);
      border-bottom: 1px solid var(--main-card-border);
      .title-left {
        width: 100%;
        .iconfont {
          font-size: 1.25rem;
          margin-right: 8px;
        }
      }
      .close {
        position: absolute;
        right: 20px;
        margin-right: 0;
        font-size: 1rem;
        border-radius: 8px;
        padding: 8px;
        transition:
          background-color 0.3s,
          transform var(--press-out) var(--press-ease);
        cursor: pointer;
        &:hover {
          background-color: var(--main-card-border);
        }
        &:active {
          transform: scale(0.9);
          transition-duration: var(--press-in);
        }
      }
    }
    .modal-content {
      max-height: calc(var(--height) - 46px);
      padding: 20px;
      overflow: auto;
    }
  }
  .modal-mobile {
    position: relative !important;
    top: auto !important;
    bottom: auto !important;
    left: auto !important;
    right: auto !important;
    // !important：覆盖 .modal .modal-main 的 calc(100% - 40px) 与内联 maxWidth
    width: 100% !important;
    max-width: 100% !important;
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
    border-radius: 20px 20px 0 0;
    overflow: hidden;
    // 关掉桌面端 fade-up，只走下方滑入滑出
    animation: none;
    .modal-drag-handle {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px 0 4px;
      cursor: grab;
      touch-action: none;
      .drag-bar {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background-color: var(--main-card-border);
      }
    }
    .title {
      position: relative;
      justify-content: center;
      .title-left {
        text-align: center;
      }
      .back {
        display: flex;
        position: absolute;
        left: 16px;
        font-size: 1.25rem;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s;
        &:active {
          background-color: var(--main-card-border);
          transition-duration: var(--press-in);
        }
      }
      .close {
        display: none;
      }
    }
    .modal-content {
      max-height: calc(100vh - 48px - 64px - 40px);
      max-height: calc(100dvh - 48px - 64px - 40px);
    }
    // 移动端布局：设置面板按钮换行（穿透 slot 内容）
    :deep(.set-list .set-item),
    :deep(.set-list .set-expand-box .set-item) {
      flex-direction: column;
      align-items: flex-start;
      .set-options {
        margin-top: 8px;
        margin-bottom: 8px;
        height: auto;
        flex-wrap: wrap;
        align-items: flex-start;
        .options {
          &:first-child {
            margin-left: 0;
          }
        }
      }
    }
  }
}
.modal-wrapper-mobile {
  align-items: flex-end;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
}
// Transition 类加在 .modal 上，面板动画用后代选择器（与 MobileWidgets 一致）
.modal.fade-enter-active .modal-mobile {
  animation: slide-up 0.3s ease-out forwards;
}
.modal.fade-leave-active .modal-mobile {
  animation: slide-down 0.3s ease-in forwards;
}
// 手势关闭：面板已被手动滑出，leave 立即结束，避免卡住导致打不开
.modal.gesture-closing.fade-leave-active {
  transition: none;
  opacity: 0;
}
.modal.gesture-closing.fade-leave-active .modal-mobile {
  animation: none;
  transform: translateY(100%);
  opacity: 0;
}
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}
</style>
