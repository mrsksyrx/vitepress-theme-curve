import { defineStore } from "pinia";
import cursorInit from "@/utils/cursor.js";
import { PERSIST_PATHS } from "@/utils/configKeys.mjs";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/commonTools.mjs";

let appCursorInstance;
// 定时切换明暗外观的 interval 句柄（不可序列化，不能放进 state，见下方注释）
let scheduledThemeTimer = null;
const isMobile =
  typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// 全站字号默认值：移动端 16，桌面 17。恢复默认/超时回滚必须用它，不要写死 17。
export const DEFAULT_FONT_SIZE = isMobile ? 16 : 17;
// 开发用版本号，每次改默认值时 +1，自动清除旧缓存
const PERSIST_VERSION = 1;
// 开发模式开关（1 = 未开启，2 = 开启）
const DEFAULT_DEV_MODE = 1;

// 模块加载时立即检查版本，确保在 pinia-persistedstate 水合之前清除旧缓存
if (typeof localStorage !== "undefined") {
  const storedVersion = parseInt(localStorage.getItem("siteDataVersion") || "0", 10);
  if (storedVersion !== PERSIST_VERSION) {
    // 版本迁移：清空旧持久化数据。站点版本/构建信息是构建期常量，
    // 不在 PERSIST_PATHS，无需保留——直接取当前构建的初始值即可。
    localStorage.removeItem("siteData");
    localStorage.setItem("siteDataVersion", String(PERSIST_VERSION));
  }
}

// 主题色 class 列表（粉色为默认，不需要 class）
const THEME_COLOR_CLASSES = [
  "theme-purple",
  "theme-blue",
  "theme-red",
  "theme-green",
  "theme-gray",
];
// 光标颜色映射
const CURSOR_COLORS = {
  light: {
    pink: "#e8558e",
    purple: "#8000ff",
    blue: "#4fc3f7",
    red: "#ef5350",
    green: "#66bb6a",
    gray: "#9e9e9e",
  },
  dark: {
    pink: "#f06292",
    purple: "#b388ff",
    blue: "#81d4fa",
    red: "#ef9a9a",
    green: "#a5d6a7",
    gray: "#757575",
  },
};

export const mainStore = defineStore("main", {
  state: () => {
    return {
      // 主题类别
      themeType: "auto",
      themeValue: "light",
      // banner
      bannerType: "half",
      // 加载状态
      // 默认不阻塞 SSR 首屏，路由切换时再由客户端显式开启 Loading。
      loadingStatus: false,
      // 滚动高度
      scrollData: {
        height: 0,
        percentage: 0,
        direction: "down",
      },
      // 页脚可见性
      footerIsShow: false,
      // 搜索框显示
      searchShow: false,
      // 个性化配置显示
      showSettings: false,
      // 播放器数据
      playState: false,
      playerShow: true,
      playerAutoPlay: false,
      playerPlayMode: "list",
      playerMusicSource: "preset",
      playerCustomIds: "",
      playerVolume: 0.7,
      playerData: {
        name: "未知曲目",
        artist: "未知艺术家",
        cover: "",
        lrc: "",
      },
      playerLyric: "",
      playerFolded: true,
      playerPanelTab: "list",
      // 超级岛播放器联动
      islandPlayerSupport: false,
      islandStyle: "extended",
      // 移动端菜单显示
      mobileMenuShow: false,
      // 使用自定义右键菜单
      useRightMenu: true,
      // 使用自定义鼠标样式
      useCustomCursor: true,
      // 背景模糊
      backgroundBlur: false,
      // 全站字体
      fontFamily: "misans",
      // 全站字体大小
      fontSize: DEFAULT_FONT_SIZE,
      fontSizePending: false,
      // 信息显示位置
      infoPosition: "fixed",
      // 上次滚动位置
      lastScrollY: 0,
      // 站点背景
      backgroundType: "patterns",
      // 第三方图片接口（非本站源），无 SRI 校验，内容与可用性由第三方控制，风险自担
      backgroundUrl: "https://api.miaomc.cn/image/get",
      // 显示更多设置
      showMoreSettings: false,
      showMoreSettingsConfirmed: false,
      // 开发中的功能展开状态
      devFeaturesExpanded: false,
      // 分支策略展开状态
      branchStrategyExpanded: false,
      // 开发模式开关（1 = 未开启，2 = 开启）
      devMode: DEFAULT_DEV_MODE,
      // 开发模式选项展开状态
      devModeOptionsExpanded: DEFAULT_DEV_MODE === 2,
      // 高对比度模式
      highContrast: false,
      // 站点布局
      siteLayout: "auto",
      siteLayoutPending: false,
      lastSiteLayout: "auto",
      windowWidth: typeof window !== "undefined" ? window.innerWidth : 1024,
      // 主题颜色
      themeColor: "pink",
      // 消息样式
      messageStyle: "island",
      messagePosition: isMobile ? "top-center" : "left-bottom",
      progressDirection: "normal",
      messageDuration: 3000,
      // 超级岛模式
      islandMode: "extended",
      islandUseThemeColor: false,
      islandShowSeconds: true,
      islandShowDate: !isMobile,
      // 自定义主题色
      customThemeEnabled: false,
      customPrimaryColor: "#e8558e",
      customSecondaryColor: "#64b5f6",
      lastCustomPrimaryColor: "#e8558e",
      lastCustomSecondaryColor: "#64b5f6",
      customThemeBeforeHighContrast: false,
      // 移除动画
      removeAnimations: false,
      // PWA 缓存增强（预留；SW 缓存策略构建期写死，此开关当前不改变行为）
      pwaCacheEnabled: true,
      // 阅读历史条目上限（超出时按 lastVisit 裁剪 localStorage.readingData）
      readingHistoryLimit: 100,
      // 阅读进度条
      readingProgressEnabled: true,
      // 正文逐行悬停侧边线（移动端默认关闭）
      hoverLineEnabled: !isMobile,
      // 图片功能开关
      imageWebpEnabled: false,
      // 天气小组件开关
      weatherWidgetEnabled: true,
      // HelloGithub 热榜开关
      helloGithubWidgetEnabled: true,
      // 标签列表开关
      tagsWidgetEnabled: true,
      // 天气小组件折叠状态
      weatherSectionExpanded: false,
      // 天气数据源（amap = 高德，wttr = wttr.in，openmeteo = Open-Meteo）
      weatherProvider: "amap",
      // 天气定位方式（satellite = 卫星定位，ip = IP定位，manual = 手动输入）
      weatherLocationMode: "satellite",
      // 手动输入的城市名
      weatherManualCity: "",
      // 天气刷新触发器（手动输入确认时 +1）
      weatherRefreshTrigger: 0,
      // 定时切换明暗显示外观
      scheduledThemeEnabled: false,
      scheduledLightTime: "07:00",
      scheduledDarkTime: "19:00",
      // scheduledThemeTimer: null, // 句柄不可序列化，已移至模块级变量
      // 站点版本信息（运行时覆盖，用于关于本站页面）
      siteVersion: "V1.4",
      siteVersionDate: "2026.10.5",
      // 分支版本（自动递增）
      branchVersion: 211,
      branchBuildTime: "2026.10.17 18:33:58",
    };
  },
  actions: {
    // 切换应用状态
    changeShowStatus(value, blur = true) {
      if (typeof document === "undefined") return; // 确保在客户端

      this[value] = !this[value];
      // 阻止滚动（引用计数，多弹窗并发时不会互相踩踏）
      if (this[value]) lockBodyScroll();
      else unlockBodyScroll();
      // 背景层模糊（弹窗/导航保持清晰；close 模式下无背景层，开关无效）
      const backgroundEl = document.querySelector(".background");
      if (backgroundEl) {
        this[value] && this.backgroundBlur && blur
          ? backgroundEl.classList.add("blur")
          : backgroundEl.classList.remove("blur");
      }
    },
    // 更改字体大小
    changeFontSize(isAdd = false) {
      if (typeof document === "undefined") return; // 确保在客户端

      if (isAdd) {
        if (this.fontSize < 24) {
          this.fontSize++;
        }
      } else {
        if (this.fontSize > 10) {
          this.fontSize--;
        }
      }
      const htmlElement = document.documentElement;
      htmlElement.style.fontSize = this.fontSize + "px";
    },
    // 切换明暗模式
    changeThemeType() {
      if (typeof window === "undefined") return; // 确保在客户端

      // 禁止壁纸模式切换
      if (this.backgroundType === "image") {
        if (typeof $message !== "undefined") {
          $message.error("无法在壁纸模式下切换明暗模式");
        }
        return false;
      }
      this.themeType === "auto"
        ? (this.themeType = "dark")
        : this.themeType === "dark"
          ? (this.themeType = "light")
          : (this.themeType = "auto");

      // 计算实际生效的 themeValue 并设置 CSS 变量
      this.updateActualThemeValue();

      // 弹窗提示
      if (typeof $message !== "undefined") {
        const typeNames = { auto: "系统", dark: "深色", light: "浅色" };
        $message.success(`显示外观已切换为${typeNames[this.themeType]}`);
      }

      // 通知光标更新主题
      if (appCursorInstance) {
        if (this.customThemeEnabled) {
          appCursorInstance.setCursorColor(this.customPrimaryColor);
        } else {
          appCursorInstance.setThemeType(this.themeType, this.themeColor);
        }
      }
    },

    // 切换主题颜色
    changeThemeColor(color) {
      if (typeof document === "undefined") return;

      this.themeColor = color;
      const html = document.documentElement;
      // 移除所有主题色 class
      THEME_COLOR_CLASSES.forEach((cls) => html.classList.remove(cls));
      // 添加新的主题色 class（粉色为默认，不需要 class）
      if (color !== "pink") {
        html.classList.add(`theme-${color}`);
      }

      // 更新光标颜色（CSS 变量 + SVG）
      const actualTheme = this.themeValue || "light";
      html.style.setProperty(
        "--cursor-bg-color",
        CURSOR_COLORS[actualTheme][color] || CURSOR_COLORS[actualTheme].pink,
      );
      if (appCursorInstance) {
        appCursorInstance.setThemeType(this.themeType, color);
      }

      // 弹窗提示
      if (typeof $message !== "undefined") {
        const colorNames = {
          pink: "泠粉",
          purple: "幻紫",
          blue: "栈蓝",
          red: "火红",
          green: "春绿",
          gray: "失灰",
        };
        $message.success(`主题色已切换为${colorNames[color]}`);
      }
    },

    // 新增方法：更新实际生效的主题值并设置CSS变量
    updateActualThemeValue() {
      if (typeof window === "undefined" || typeof document === "undefined") return; // 确保在客户端

      let actualTheme;
      if (this.themeType === "auto") {
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        actualTheme = prefersDarkMode ? "dark" : "light";
      } else {
        actualTheme = this.themeType;
      }
      this.themeValue = actualTheme;

      const root = document.documentElement;
      if (this.customThemeEnabled) {
        root.style.setProperty("--cursor-bg-color", this.customPrimaryColor);
      } else {
        root.style.setProperty(
          "--cursor-bg-color",
          CURSOR_COLORS[actualTheme][this.themeColor] || CURSOR_COLORS[actualTheme].pink,
        );
      }

      if (actualTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    },

    // 新增action: 外部触发更新主题（用于系统主题变化）
    triggerThemeUpdate() {
      if (typeof window === "undefined") return; // 确保在客户端
      this.updateActualThemeValue();
      if (appCursorInstance) {
        if (this.customThemeEnabled) {
          appCursorInstance.setCursorColor(this.customPrimaryColor);
        } else {
          appCursorInstance.setThemeType(this.themeType, this.themeColor);
        }
      }
    },

    // 切换自定义鼠标样式
    toggleCustomCursor() {
      if (typeof window === "undefined" || !appCursorInstance) return;
      if (this.useCustomCursor) {
        appCursorInstance.enable();
      } else {
        appCursorInstance.disable();
      }
    },
    // 应用自定义主题色
    applyCustomThemeColor(primary, secondary) {
      if (typeof document === "undefined") return;
      const html = document.documentElement;
      // 移除所有预设主题 class
      THEME_COLOR_CLASSES.forEach((cls) => html.classList.remove(cls));
      // 设置 CSS 变量
      html.style.setProperty("--main-color", primary);
      html.style.setProperty("--main-color-bg", primary + "0d");
      html.style.setProperty("--main-accent", secondary);
      html.style.setProperty("--main-accent-bg", secondary + "1a");
      // 更新光标颜色
      html.style.setProperty("--cursor-bg-color", primary);
      if (appCursorInstance) {
        appCursorInstance.setCursorColor(primary);
      }
      // 弹窗提示
      if (typeof $message !== "undefined") {
        $message.success("自定义主题色已应用", { duration: 3000 });
      }
    },

    // 定时切换明暗显示外观
    startScheduledTheme() {
      if (typeof window === "undefined") return;
      this.stopScheduledTheme();

      const checkAndSwitch = () => {
        if (!this.scheduledThemeEnabled) return;

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;

        const lightTime = this.scheduledLightTime;
        const darkTime = this.scheduledDarkTime;

        let shouldLight = false;
        let shouldDark = false;

        // 判断当前时间是否在浅色或深色时段
        if (lightTime <= darkTime) {
          // 例如 07:00 - 19:00
          shouldLight = currentTime >= lightTime && currentTime < darkTime;
          shouldDark = currentTime >= darkTime || currentTime < lightTime;
        } else {
          // 跨天情况，例如 22:00 - 06:00
          shouldLight = currentTime >= lightTime || currentTime < darkTime;
          shouldDark = currentTime >= darkTime && currentTime < lightTime;
        }

        // 切换主题（如果壁纸模式则跳过）
        if (this.backgroundType === "image") return;

        if (shouldLight && this.themeType !== "light") {
          this.themeType = "light";
          this.updateActualThemeValue();
        } else if (shouldDark && this.themeType !== "dark") {
          this.themeType = "dark";
          this.updateActualThemeValue();
        }
      };

      // 立即检查一次
      checkAndSwitch();

      // 每分钟检查一次
      scheduledThemeTimer = setInterval(checkAndSwitch, 60000);
    },

    stopScheduledTheme() {
      if (scheduledThemeTimer) {
        clearInterval(scheduledThemeTimer);
        scheduledThemeTimer = null;
      }
    },
  },
  // 数据持久化（键列表见 utils/configKeys.mjs，与配置导入/导出共用）
  persist: [
    {
      key: "siteData",
      paths: PERSIST_PATHS,
    },
  ],
});

// 在 Pinia store 被创建后，初始化光标并处理主题设置
export const initializeCursor = () => {
  // 确保只在客户端执行初始化
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const store = mainStore();

  if (!appCursorInstance) {
    appCursorInstance = cursorInit(); // cursorInit 内部也有环境判断
  }

  // 如果 appCursorInstance 在非浏览器环境下返回 null，则跳过后续操作
  if (!appCursorInstance) {
    return;
  }

  store.updateActualThemeValue();
  if (store.customThemeEnabled) {
    appCursorInstance.setCursorColor(store.customPrimaryColor);
  } else {
    appCursorInstance.setThemeType(store.themeType, store.themeColor);
  }

  // 根据 useCustomCursor 状态启用/禁用自定义鼠标
  if (!store.useCustomCursor) {
    appCursorInstance.disable();
  }

  // 新增：设置 html 元素的字体大小
  document.documentElement.style.fontSize = store.fontSize + "px";

  if (window.matchMedia) {
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      if (store.themeType === "auto") {
        store.triggerThemeUpdate();
      }
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQueryList.addListener(handleSystemThemeChange);
    }
  }
};
