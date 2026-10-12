import { nextTick } from "vue";
import { mainStore } from "@/store";
import { jumpRedirect } from "./commonTools.mjs";

// 必要数据
let loadingTimer = null;
let lastPathName = null;

// 是否仅触发跳转后
let isOnlyAfter = false;

/**
 * 判断是否即将导航到的地址和当前地址是相同页面
 * @return {boolean} 为 true 时表示是相同页面
 */
export const isSamePage = (to) => {
  if (typeof window === "undefined") return false;
  // 获取跳转到的页面路径
  const toURL = new URL(to, window.location.origin);
  const targetPathWithoutHash = toURL.pathname;
  // 获取当前页面的路径
  const currentURL = new URL(window.location.href);
  const currentPathWithoutHash = currentURL.pathname;
  return targetPathWithoutHash === currentPathWithoutHash;
};

// 路由跳转前
export const routeChange = (type, to) => {
  if (typeof window === "undefined") return false;
  // 跳转前
  if (type === "before") {
    isOnlyAfter = false;
    // const isSame = isSamePage(to);
    // 更改上次路径
    lastPathName = new URL(to, window.location.origin).pathname;
    // 开始动画
    changeLoading({ always: true });
  }
  // 跳转后
  else if (type === "after") {
    const isSame = isSamePage(to);
    const pathName = new URL(to, window.location.origin).pathname;
    if (isSame && lastPathName === pathName) {
      if (!isOnlyAfter) changeLoading();
      return false;
    } else {
      changeLoading();
    }
    isOnlyAfter = true;
    // 更改上次路径
    lastPathName = new URL(to, window.location.origin).pathname;
  }
};

// 切换加载状态
const changeLoading = (option = {}) => {
  // pinia
  const store = mainStore();
  // 获取配置
  const { status = true, always = false } = option;
  // 清除上一次未触发的定时器，避免旧定时器提前关闭新导航的加载状态
  clearTimeout(loadingTimer);
  loadingTimer = null;
  // 开始加载
  store.loadingStatus = status;
  // 是否不结束
  if (always) return;
  // 随机延时结束
  loadingTimer = setTimeout(
    () => {
      store.loadingStatus = false;
      // 跨页锚点补滚动：路由切换期间 .main-layout.loading 是 display:none，
      // VitePress 在 loadPage 的 nextTick 里量到的 getBoundingClientRect 全是 0，
      // 锚点滚动会落到错误位置。等 loading 结束、布局恢复后再滚一次。
      if (typeof window !== "undefined" && window.location.hash) {
        nextTick(() => {
          requestAnimationFrame(() => {
            try {
              const id = decodeURIComponent(window.location.hash).slice(1);
              const target = document.getElementById(id);
              if (target) {
                const top = window.scrollY + target.getBoundingClientRect().top - 80;
                window.scrollTo({ top, behavior: "instant" });
              }
            } catch (e) {
              console.warn(e);
            }
          });
        });
      }
      // 替换链接
      // jumpRedirect(null, true);
      // 定时器已触发，clearTimeout 无效；入口处已有正确清理
      // clearTimeout(loadingTimer);
    },
    Math.floor(Math.random() * (800 - 260 + 1)) + 260,
  );
};
