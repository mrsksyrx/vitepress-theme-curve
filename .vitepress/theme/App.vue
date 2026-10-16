<template>
  <!-- 背景图片 -->
  <Background />
  <!-- 加载提示 -->
  <Loading />
  <!-- 阅读进度条 -->
  <ReadingProgress />
  <!-- 正文逐行悬停侧边线 -->
  <HoverLine />
  <!-- 导航栏 -->
  <Nav />
  <!-- 主内容 -->
  <main :class="['main-layout', { loading: loadingStatus, 'is-post': isPostPage }]">
    <!-- 404 -->
    <NotFound v-if="page.isNotFound" />
    <!-- 首页 -->
    <Home v-if="frontmatter.layout === 'home'" showHeader />
    <!-- 页面 -->
    <template v-else>
      <!-- 文章页面 -->
      <Post v-if="isPostPage" />
      <!-- 普通页面 -->
      <Page v-else-if="!page.isNotFound" />
    </template>
  </main>
  <!-- 页脚 -->
  <FooterLink v-show="!loadingStatus" :showBar="isPostPage && !page.isNotFound" />
  <!-- 页脚框外致谢 -->
  <div v-show="!loadingStatus" class="footer-credit">
    本站的诞生离不开上游作者的开源贡献。在此感谢他（她）们。本站遵循
    <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer"
      ><strong>AGPL v3</strong></a
    >
    协议
    <a
      href="https://github.com/mrsksyrx/vitepress-theme-curve"
      target="_blank"
      rel="noopener noreferrer"
      ><strong>开源</strong></a
    >
    。
  </div>
  <Footer v-show="!loadingStatus" />
  <!-- 悬浮菜单 -->
  <Teleport to="body">
    <!-- 左侧菜单 -->
    <div :class="['left-menu', { hidden: footerIsShow }]">
      <!-- 全局播放器（拓展模式下隐藏但保留挂载） -->
      <ClientOnly>
        <div v-show="store.islandStyle !== 'extended'">
          <Player />
        </div>
      </ClientOnly>
      <!-- 全局设置 -->
      <Settings />
    </div>
  </Teleport>
  <!-- 右键菜单 -->
  <RightMenu ref="rightMenuRef" />
  <!-- 全局消息 -->
  <Message />
  <!-- 底部固定药丸 -->
  <ClientOnly>
    <BottomPills />
  </ClientOnly>
  <!-- 导入后检查弹窗 -->
  <Teleport to="body">
    <div v-if="importCheckVisible" class="import-check-overlay">
      <div class="import-check-dialog">
        <span class="import-check-title">网站能正常工作吗？</span>
        <span class="import-check-countdown">{{ importCheckCountdown }}秒后将恢复原配置</span>
        <div class="import-check-actions">
          <span class="import-check-btn import-check-no" @click="importCheckFail">不能</span>
          <span class="import-check-btn import-check-yes" @click="importCheckPass">能</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore, initializeCursor, DEFAULT_FONT_SIZE } from "@/store";
import { calculateScroll, specialDayGray } from "@/utils/helper";
import { ensureGlobalFontsLoaded } from "@/utils/fontLoader.mjs";

// const screenWidth = ref(0);
const route = useRoute();
const store = mainStore();
const { frontmatter, page } = useData();
const {
  loadingStatus,
  footerIsShow,
  themeValue,
  themeType,
  themeColor,
  highContrast,
  backgroundType,
  fontFamily,
  fontSize,
  fontSizePending,
  siteLayout,
  siteLayoutPending,
  messagePosition,
  removeAnimations,
} = storeToRefs(store);
let fontSwitchTaskId = 0;

// 导入后检查
const importCheckVisible = ref(false);
const importCheckCountdown = ref(10);
let importCheckTimer = null;
// 保留同一 MediaQueryList 实例，卸载时才能移除 change 监听
let colorSchemeMql = null;

//2025.06.12更新：在 Next.js 的服务端渲染过程中，应用会在服务器端先进行渲染
//而在服务器端的 JavaScript 环境中，并没有浏览器提供的 window 对象。
//最简单的解决方法是确保在客户端代码中访问 window
//可以通过判断代码是否在浏览器环境中运行来避免在服务器端渲染时执行涉及 window 的代码
//onMounted 钩子： 在 setup 或 data 中避免直接访问 window。
//将依赖 window 对象的代码放入 onMounted 钩子中，因为 onMounted 只会在组件挂载到DOM后执行。
// onMounted(() => {
// 只有在浏览器环境才会执行
// if (typeof window !== 'undefined') {
//   console.log(window.innerWidth);
// }
// })
// onMounted(() => {
// 这里的代码只会在浏览器环境中执行
//   screenWidth.value = window.screen.width;
// });
// 右键菜单
const rightMenuRef = ref(null);

// 导入后检查函数
const importCheckPass = () => {
  importCheckVisible.value = false;
  clearInterval(importCheckTimer);
  localStorage.removeItem("importJustCompleted");
  if (typeof $message !== "undefined") {
    $message.success("配置导入成功");
  }
};

const importCheckFail = () => {
  importCheckVisible.value = false;
  clearInterval(importCheckTimer);
  localStorage.removeItem("siteData");
  localStorage.removeItem("importJustCompleted");
  location.reload();
};

const startImportCheck = () => {
  importCheckCountdown.value = 10;
  importCheckVisible.value = true;
  importCheckTimer = setInterval(() => {
    importCheckCountdown.value--;
    if (importCheckCountdown.value <= 0) {
      importCheckFail();
    }
  }, 1000);
};

// 判断是否为文章页面：路径在 posts/ 下，或 frontmatter 显式声明 layout: post
// （pages/ 下的独立文章用后者走文章样式，又不进 RSS / 文章列表）
const isPostPage = computed(() => {
  // 不要 decodeURIComponent：文件名含裸 %（如 100%_done）时会抛 URIError 白屏。
  // pathname 里 "/posts/" 是字面量，直接 includes 即可。
  return route.path.includes("/posts/") || frontmatter.value.layout === "post";
});

// 开启右键菜单
const openRightMenu = (e) => {
  rightMenuRef.value?.openRightMenu(e);
};

// 复制时触发
const copyTip = () => {
  const copiedText = window.getSelection().toString();
  // 检查文本内容是否不为空
  if (copiedText.trim().length > 0 && typeof $message !== "undefined") {
    $message.success("复制成功，在转载时请标注本文地址");
  }
};

// 更改正确主题类别
const changeSiteThemeType = () => {
  // 主题 class
  const themeClasses = {
    dark: "dark",
    light: "light",
    auto: "auto",
  };
  // 必要数据
  const htmlElement = document.documentElement;
  // 清除所有 class
  Object.values(themeClasses).forEach((themeClass) => {
    htmlElement.classList.remove(themeClass);
  });
  // 添加新的 class
  if (themeType.value === "auto") {
    // 根据当前操作系统颜色方案更改明暗主题
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const autoThemeClass = systemPrefersDark ? themeClasses.dark : themeClasses.light;
    htmlElement.classList.add(autoThemeClass);
    themeValue.value = autoThemeClass;
  } else if (themeClasses[themeType.value]) {
    htmlElement.classList.add(themeClasses[themeType.value]);
    themeValue.value = themeClasses[themeType.value];
  }
  if (backgroundType.value === "image") {
    htmlElement.classList.add("image");
  } else {
    htmlElement.classList.remove("image");
  }
  // 应用主题色
  const themeColors = ["theme-purple", "theme-blue", "theme-red", "theme-green", "theme-gray"];
  themeColors.forEach((cls) => htmlElement.classList.remove(cls));
  if (themeColor.value !== "pink") {
    htmlElement.classList.add(`theme-${themeColor.value}`);
  }
};

// 切换系统字体样式
const changeSiteFont = async () => {
  try {
    const currentTaskId = ++fontSwitchTaskId;
    const htmlElement = document.documentElement;
    htmlElement.style.fontSize = fontSize.value + "px";
    await ensureGlobalFontsLoaded(fontFamily.value);

    if (currentTaskId !== fontSwitchTaskId) return;

    htmlElement.classList.remove("vsans", "hmos", "xlfont", "misans", "browserfont");
    htmlElement.classList.add(fontFamily.value);
  } catch (error) {
    console.error("切换系统字体样式失败", error);
  }
};

// 监听设置变化
watch(
  () => [themeType.value, backgroundType.value, themeColor.value],
  () => changeSiteThemeType(),
);
watch(
  () => fontFamily.value,
  () => changeSiteFont(),
);

// 切换站点布局
const changeSiteLayout = () => {
  const html = document.documentElement;
  html.classList.remove("force-pc", "force-mobile");
  if (siteLayout.value === "pc") {
    html.classList.add("force-pc");
  } else if (siteLayout.value === "mobile") {
    html.classList.add("force-mobile");
  }
};
watch(
  () => siteLayout.value,
  () => changeSiteLayout(),
);

onMounted(() => {
  initializeCursor();
  // 全站置灰
  specialDayGray();
  // 更改主题类别
  changeSiteThemeType();
  // 高对比度模式
  if (highContrast.value === "max") {
    document.documentElement.classList.add("high-contrast", "high-contrast-max");
  } else if (highContrast.value) {
    document.documentElement.classList.add("high-contrast");
  }
  // 自定义主题色
  if (store.customThemeEnabled) {
    const html = document.documentElement;
    html.style.setProperty("--main-color", store.customPrimaryColor);
    html.style.setProperty("--main-color-bg", store.customPrimaryColor + "0d");
    html.style.setProperty("--main-accent", store.customSecondaryColor);
    html.style.setProperty("--main-accent-bg", store.customSecondaryColor + "1a");
  }
  // 切换系统字体样式
  changeSiteFont();
  // 切换站点布局
  changeSiteLayout();
  // 根据当前窗口宽度初始化消息位置
  if (siteLayout.value === "auto" || siteLayout.value === "mobile") {
    const isMobileView = window.innerWidth <= 768;
    const cornerPositions = ["left-top", "left-bottom", "right-top", "right-bottom"];
    const centerPositions = ["top-center", "bottom-center"];
    if (isMobileView && cornerPositions.includes(messagePosition.value)) {
      messagePosition.value = "top-center";
    } else if (!isMobileView && centerPositions.includes(messagePosition.value)) {
      messagePosition.value = "left-bottom";
    }
  }
  // 检查字体大小待确认状态
  if (fontSizePending.value) {
    fontSize.value = DEFAULT_FONT_SIZE;
    fontSizePending.value = false;
    document.documentElement.style.fontSize = DEFAULT_FONT_SIZE + "px";
    if (typeof $message !== "undefined") {
      $message.warning("上次的字体大小未确认，已恢复为默认大小");
    }
  }
  // 检查站点布局待确认状态
  if (siteLayoutPending.value) {
    siteLayout.value = "auto";
    siteLayoutPending.value = false;
    changeSiteLayout();
    if (typeof $message !== "undefined") {
      $message.warning("上次选择的布局未确认，已恢复为自动选择");
    }
  }
  // 恢复移除动画设置
  if (removeAnimations.value) {
    document.documentElement.classList.add("remove-animations");
  }
  // 滚动监听
  window.addEventListener("scroll", calculateScroll);
  // 右键监听
  window.addEventListener("contextmenu", openRightMenu);
  // 复制监听
  window.addEventListener("copy", copyTip);
  // 监听系统颜色
  colorSchemeMql = window.matchMedia("(prefers-color-scheme: dark)");
  colorSchemeMql.addEventListener("change", changeSiteThemeType);
  // 检查是否需要显示导入后检查弹窗
  if (localStorage.getItem("importJustCompleted") === "true") {
    startImportCheck();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", calculateScroll);
  window.removeEventListener("contextmenu", openRightMenu);
  window.removeEventListener("copy", copyTip);
  colorSchemeMql?.removeEventListener("change", changeSiteThemeType);
  colorSchemeMql = null;
  clearInterval(importCheckTimer);
});
</script>

<style lang="scss" scoped>
.main-layout {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  // 手动实现加载动画
  animation: show 0.5s forwards;
  animation-duration: 0.5s;
  display: block;
  &.loading {
    display: none;
  }
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    &.is-post {
      padding: 0;
    }
  }
}
.footer-credit {
  width: 100%;
  max-width: 1400px;
  margin: -0.5rem auto 0.8rem;
  padding: 0 1rem;
  text-align: center;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.5;
  a {
    color: var(--main-color);
    &:hover {
      opacity: 0.8;
    }
  }
}
.left-menu {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition:
    opacity 0.3s,
    transform 0.3s;
  &.hidden {
    opacity: 0;
    transform: translateY(100px);
    pointer-events: none;
  }
}
.import-check-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.import-check-dialog {
  background-color: #f5f3ff;
  border: 2px solid #c4b5fd;
  border-radius: 12px;
  padding: 24px 32px;
  text-align: center;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.import-check-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #7c3aed;
  margin-bottom: 8px;
}
.import-check-countdown {
  display: block;
  font-size: 13px;
  color: #7c3aed;
  opacity: 0.8;
  margin-bottom: 16px;
}
.import-check-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.import-check-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9375rem;
  padding: 8px 16px;
  min-width: 60px;
  border-radius: 8px;
  cursor: pointer;
  transition:
    color 0.3s,
    background-color 0.3s,
    transform var(--press-out) var(--press-ease);
  &:active {
    transform: scale(0.95);
    transition-duration: var(--press-in);
  }
}
.import-check-no {
  color: #7c3aed;
  border: 1px solid #7c3aed;
  background-color: transparent;
  &:hover {
    color: #6d28d9;
    border-color: #6d28d9;
  }
}
.import-check-yes {
  color: #fff;
  background-color: #7c3aed;
  &:hover {
    background-color: #6d28d9;
  }
}
html.dark {
  .import-check-dialog {
    background-color: #1e1833;
    border-color: #3b2d6b;
  }
  .import-check-title,
  .import-check-countdown {
    color: #a78bfa;
  }
  .import-check-countdown {
    opacity: 0.8;
  }
  .import-check-no {
    color: #a78bfa;
    border-color: #a78bfa;
    &:hover {
      color: #c4b5fd;
      border-color: #c4b5fd;
    }
  }
  .import-check-yes {
    background-color: #7c3aed;
    &:hover {
      background-color: #6d28d9;
    }
  }
}
</style>
