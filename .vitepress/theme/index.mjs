import { h } from "vue";
import { createPinia } from "pinia";
import { routeChange } from "@/utils/initTools.mjs";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import LazyLoader from "@/components/LazyLoader.vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { consumeSkipPwaRegistration } from "@/utils/storageReset.mjs";
import initImageLazy from "@/utils/initImageLazy.mjs";
import { mainStore } from "@/store";

// 根组件
import App from "@/App.vue";
// 全局样式
import "@/style/main.scss";

// pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// PWA 注册由主题接管（config.mjs 中 injectRegister: false），不走 virtual:pwa-register，
// 避免为了一个简单注册额外打包 workbox-window。
// “清除所有数据”会注销 SW；紧随其后的刷新必须跳过一次注册，否则刚清掉的
// Service Worker 与 Cache Storage 会在刷新页重新安装。
const registerPwa = () => {
  if (
    !import.meta.env.PROD ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  try {
    navigator.serviceWorker
      .register(`${normalizedBase}sw.js`, { scope: normalizedBase })
      .catch((error) => console.warn("Service Worker 注册失败：", error));
  } catch (error) {
    console.warn("Service Worker 注册失败：", error);
  }
};

if (!consumeSkipPwaRegistration()) {
  registerPwa();
}

// Theme
const Theme = {
  // extends: Theme,
  Layout: () => {
    return h(App);
  },
  enhanceApp({ app, router, siteData }) {
    // 挂载
    app.use(pinia);
    app.component("LazyLoader", LazyLoader);
    // 插件
    enhanceAppWithTabs(app);
    // 路由守卫
    router.onBeforeRouteChange = (to) => {
      routeChange("before", to);
    };
    router.onAfterRouteChanged = (to) => {
      routeChange("after", to);
      // 图片懒加载增强
      setTimeout(() => {
        const store = mainStore();
        initImageLazy({
          webpEnabled: store.imageWebpEnabled,
        });
      }, 100);
    };
  },
};

export default Theme;
