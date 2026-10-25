<template>
  <Teleport to="body">
    <!-- 移动端菜单 -->
    <Transition name="fade" mode="out-in">
      <div
        v-show="store.mobileMenuShow"
        :class="['mobile-menu', { 'gesture-closing': gestureClosing }]"
      >
        <!-- 背景遮罩 -->
        <div ref="menuMaskEl" class="menu-mask" @click="closeMenu" />
        <Transition name="toLeft" mode="out-in">
          <div
            v-show="store.mobileMenuShow"
            ref="menuContentEl"
            :class="['menu-content', 's-card', { 'gesture-closing': gestureClosing }]"
            @click.stop
            @touchstart.passive="onTouchStart"
            @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd"
          >
            <!-- 顶部控制栏：网址 + 关闭按钮 -->
            <div class="menu-top-control">
              <!-- 网址 -->
              <span class="site-url">
                <span>example</span><span class="pill-domain">.com</span>
              </span>
              <!-- 关闭按钮 -->
              <div class="close-control" @click="closeMenu">
                <i class="iconfont icon-close"></i>
              </div>
            </div>
            <!-- 站点名称 -->
            <span class="site-label">My Curve Blog</span>
            <hr />
            <!-- 个性化配置 + 主题切换 -->
            <div class="menu-top-control settings-row">
              <div class="settings-btn" title="个性化配置" @click="openSettings">
                <i class="iconfont icon-style"></i>
                <span class="capsule-text">个性化配置</span>
              </div>
              <div class="theme-toggle-btn" title="显示模式切换" @click.stop="toggleTheme">
                <i
                  :key="store.themeType"
                  :class="`iconfont icon-${store.themeType} theme-icon-animated`"
                ></i>
              </div>
            </div>
            <!-- 菜单 -->
            <div class="menu-list">
              <div v-for="(item, index) in nav" :key="index" class="menu-item">
                <span class="link-title"> {{ item.text }}</span>
                <div v-if="item.items" class="link-child">
                  <div
                    v-for="(child, childIndex) in item.items"
                    :key="childIndex"
                    class="link-child-btn"
                    @click="pageJump(child.link)"
                  >
                    <i v-if="child.icon" :class="`iconfont icon-${child.icon}`" />
                    <span class="name">{{ child.text }}</span>
                  </div>
                  <!-- 随机文章（仅文库） -->
                  <div v-if="index === 0" class="link-child-btn" @click="shuffleGo">
                    <i class="iconfont icon-shuffle"></i>
                    <span class="name">随便看看</span>
                  </div>
                </div>
              </div>
            </div>
            <hr />
            <!-- 标签 -->
            <div class="tags-list menu-item">
              <span class="link-title"> 标签</span>
              <div class="link-child">
                <div
                  v-for="(item, tag, index) in tagsData"
                  :key="index"
                  class="link-child-btn"
                  @click="pageJump(`/pages/tags/${encodeURIComponent(tag)}`)"
                >
                  <span class="name">{{ tag }}</span>
                  <sup class="num">{{ item.count }}</sup>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { mainStore } from "@/store";
import { usePostData } from "@/utils/usePostData.mjs";
import { shufflePost } from "@/utils/helper";

const store = mainStore();
const router = useRouter();
const { theme } = useData();

const closeMenu = () => store.changeShowStatus("mobileMenuShow");

// 右滑关闭手势（侧边栏从右侧滑入）
const menuContentEl = ref(null);
const menuMaskEl = ref(null);
const gestureClosing = ref(false);

let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let isDragging = false;
let dragAxis = null; // null | "x" | "y" — 首次移动时锁定轴向，避免和纵向滚动打架

const onTouchStart = (e) => {
  // 列表已滚动时不接管，交给内部滚动
  const el = menuContentEl.value;
  if (el && el.scrollTop > 0) {
    isDragging = false;
    return;
  }
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchCurrentX = touchStartX;
  isDragging = true;
  dragAxis = null;
};

const onTouchMove = (e) => {
  if (!isDragging) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  const dx = x - touchStartX;
  const dy = y - touchStartY;

  // 首次超过阈值时锁定轴向：横向则接管跟手，纵向则放弃交给滚动
  if (!dragAxis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    dragAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (dragAxis === "y") {
      isDragging = false;
      return;
    }
  }
  if (dragAxis !== "x") return;

  touchCurrentX = x;
  // 只允许向右拖（dx > 0），向左回拖贴 0
  const diff = Math.max(0, dx);
  const panel = menuContentEl.value;
  if (panel) {
    const progress = Math.min(diff / 300, 1);
    const opacity = 1 - progress * 0.3;
    panel.style.transform = `translateX(${diff}px)`;
    panel.style.transition = "none";
    panel.style.opacity = opacity;
    const mask = menuMaskEl.value;
    if (mask) {
      mask.style.opacity = opacity;
    }
  }
};

const onTouchEnd = () => {
  if (!isDragging || dragAxis !== "x") {
    isDragging = false;
    dragAxis = null;
    return;
  }
  const diff = touchCurrentX - touchStartX;
  const panel = menuContentEl.value;
  const mask = menuMaskEl.value;
  const shouldClose = diff > 80;

  if (shouldClose) {
    // 标记后关闭：跳过 toLeft leave，避免从原位再播一次
    gestureClosing.value = true;
    if (panel) {
      panel.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
      panel.style.transform = "translateX(100%)";
      panel.style.opacity = "0";
    }
    if (mask) {
      mask.style.transition = "opacity 0.3s ease-out";
      mask.style.opacity = "0";
    }
    setTimeout(() => {
      closeMenu();
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
      if (panel) panel.style.transition = "";
      if (mask) mask.style.transition = "";
    }, 250);
  }
  isDragging = false;
  dragAxis = null;
};

// 重新打开时复位：清掉手势 inline 样式，保证下次进场动画正常
watch(
  () => store.mobileMenuShow,
  (val) => {
    if (!val) return;
    gestureClosing.value = false;
    const panel = menuContentEl.value;
    const mask = menuMaskEl.value;
    if (panel) {
      panel.style.transform = "";
      panel.style.transition = "";
      panel.style.opacity = "";
    }
    if (mask) {
      mask.style.opacity = "";
      mask.style.transition = "";
    }
  },
);

// 菜单数据
// nav 来自主题配置；tagsData **不在** themeConfig 里（config.mjs 只注入了 postCount），
// 必须走文章索引。原实现 `const { nav, tagsData } = theme.value` 解构的是不存在的字段，
// 于是移动端「标签」区块恒为空（标题与分隔线照常渲染）。改用与 Aside/Widgets/Tags.vue
// 相同的 usePostData() 数据源。
const { nav } = theme.value;
const { tagsData, loadPostData } = usePostData();

onMounted(() => {
  // 移动端菜单只在用户点击后可见，这里提前取索引，避免展开时空白
  loadPostData();
});

// 页面跳转
const pageJump = (url) => {
  if (!url) return false;
  store.changeShowStatus("mobileMenuShow");
  // 站外链接交给浏览器新开标签，router.go 会丢弃 origin 把用户送回站内
  if (/^https?:\/\//i.test(url)) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  router.go(url);
};

// 随机文章
const shuffleGo = async () => {
  store.changeShowStatus("mobileMenuShow");
  const data = await loadPostData();
  if (data?.length) {
    router.go(shufflePost(data));
  }
};

// 主题切换
const toggleTheme = () => {
  store.changeThemeType();
};

// 打开个性化配置，同时收起侧边栏
const openSettings = () => {
  store.changeShowStatus("mobileMenuShow");
  store.changeShowStatus("showSettings");
};

// [B48-冗余] 与上方 onMounted 重复，loadPostData 幂等，注释掉
// onMounted(() => {
//   loadPostData();
// });
</script>

<style lang="scss" scoped>
.theme-icon-animated {
  animation: themeIconSwitch 0.3s ease-out forwards;
  transform-origin: center center;
}
@keyframes themeIconSwitch {
  0% {
    opacity: 0;
    transform: rotate(180deg) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}
// 手势关闭：面板已被手动滑出，跳过 toLeft leave，避免从原位再播一次闪现
.menu-content.gesture-closing.toLeft-leave-active {
  transition: none;
  transform: translateX(100%);
  opacity: 0;
}
.mobile-menu.gesture-closing.fade-leave-active {
  transition: none;
  opacity: 0;
}
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  // 高于 BottomPills（9999），避免播放器胶囊压住侧边栏
  z-index: 10000;
  .menu-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-color: var(--main-mask-background);
  }
  .menu-content {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 100%;
    max-width: 300px;
    border-radius: 12px 0 0 12px;
    padding: 20px;
    overflow: auto;
    .menu-top-control {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      margin-right: -5px;
      &.settings-row {
        margin-top: 4px;
        gap: 8px;
        align-items: center;
        justify-content: flex-start;
      }
    }
    .theme-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background-color: var(--main-card-background);
      border: 1px solid var(--main-card-border);
      flex-shrink: 0;
      cursor: pointer;
      user-select: none;
      transition: transform var(--press-out) var(--press-ease);
      .iconfont {
        font-size: 22px;
        color: var(--main-font-color);
        transition: color 0.3s;
      }
      &:hover .iconfont {
        color: var(--main-color);
      }
      &:active {
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    .site-url {
      font-size: 14px;
      font-weight: 500;
      color: var(--main-font-color);
      line-height: 35px;
      .pill-prefix {
        &.info {
          color: #3498db;
        }
        &.warning {
          color: #e67e22;
        }
        &.error {
          color: #e74c3c;
        }
      }
      .pill-domain {
        color: var(--main-color);
      }
    }
    .site-label {
      display: block;
      font-size: 16px;
      color: var(--main-font-color);
      font-weight: bold;
      margin-top: -16px;
      margin-bottom: 0;
    }
    .settings-btn {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 42px;
      padding: 0 16px 0 10px;
      border-radius: 12px;
      background-color: var(--main-color);
      transition:
        opacity 0.3s,
        transform var(--press-out) var(--press-ease);
      cursor: pointer;
      .iconfont {
        font-size: 22px;
        color: var(--main-card-background);
      }
      .capsule-text {
        margin-left: 10px;
        font-size: 14px;
        line-height: 1;
        color: var(--main-card-background);
      }
      &:hover {
        opacity: 0.8;
      }
      &:active {
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    .close-control {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 35px;
      height: 35px;
      padding: 0;
      flex-shrink: 0;
      transition:
        background-color 0.3s,
        opacity 0.3s;
      border-radius: 50%;
      cursor: pointer;
      .iconfont {
        font-size: 18px;
        line-height: 1;
        color: var(--main-font-second-color);
        transition:
          color 0.3s,
          opacity 0.3s;
      }
      &:hover {
        background-color: var(--main-color);
        .iconfont {
          color: var(--main-card-background);
        }
      }
      &:active {
        background-color: var(--main-color);
        transition-duration: var(--press-in);
        .iconfont {
          color: var(--main-card-background);
          transition-duration: var(--press-in);
        }
      }
    }
    .menu-list {
      margin-bottom: 20px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .menu-item {
      margin-bottom: 12px;
      .link-title {
        font-size: 14px;
        margin-bottom: 12px;
        display: inline-block;
        color: var(--main-font-second-color);
      }
      .link-child {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
        .link-child-btn {
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          border-radius: 8px;
          padding: 10px 12px;
          background-color: var(--main-card-background);
          border: 1px solid var(--main-card-border);
          box-shadow: 0 8px 16px -4px var(--main-border-shadow);
          transition: transform var(--press-out) var(--press-ease);
          font-size: 15px;
          .iconfont {
            margin-right: 6px;
            opacity: 0.6;
          }
          .name {
            max-width: 80px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .num {
            opacity: 0.4;
            font-size: 12px;
            margin-bottom: auto;
            margin-left: 4px;
          }
          &:active {
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
    // 标签名较长（如 Android玩机）用满整列宽度，不按固定 80px 截断
    .tags-list .link-child .link-child-btn .name {
      max-width: 100%;
      min-width: 0;
    }
    hr {
      margin: 1rem 0;
      opacity: 0.4;
      border: 1px dashed var(--main-font-second-color);
    }
  }
}
</style>
