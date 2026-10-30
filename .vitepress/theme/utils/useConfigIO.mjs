import { ref } from "vue";
import { PORTABLE_CONFIG_KEYS } from "./configKeys.mjs";
import { safeStorage } from "./safeStorage.mjs";

// 混淆编码
const obfuscate = (str) => {
  const shifted = str
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      return String.fromCharCode(code + 3);
    })
    .join("");
  return btoa(encodeURIComponent(shifted));
};

// 混淆解码
const deobfuscate = (str) => {
  const decoded = decodeURIComponent(atob(str));
  return decoded
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      return String.fromCharCode(code - 3);
    })
    .join("");
};

// "V1.10" / "1.10.2" → [1, 10, 2]
const parseVersionParts = (input) => {
  const parts = String(input ?? "")
    .replace(/^[Vv]/, "")
    .split(".")
    .map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

const compareVersions = (a, b) => {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
};

// 旧导出格式把 V/. 剥掉后 parseInt（"V1.10" → 110），仅用于旧文件的就近比较
const legacyVersionNumber = (input) => parseInt(String(input).replace(/[Vv.]/g, ""), 10) || 10;

// 自定义主题色只接受 #RRGGBB：Settings 文本框按 #RRGGBB 输入（maxlength 7），
// applyCustomThemeColor 还会在色值后拼 alpha 后缀构造 --main-color-bg，
// 3/4/8 位色值会拼出非法 CSS 变量被静默丢弃，故不留口子
const isValidHexColor = (value) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

// 导入校验白名单：不在名单内的值一律丢弃，不写入 siteData
const ENUM_RULES = {
  themeType: ["auto", "dark", "light"],
  themeColor: ["pink", "purple", "blue", "red", "green", "gray"],
  fontFamily: ["misans", "xlfont", "browserfont", "vsans", "hmos"],
  backgroundType: ["close", "patterns", "image"],
  bannerType: ["half", "full"],
  siteLayout: ["auto", "pc", "mobile"],
  lastSiteLayout: ["auto", "pc", "mobile"],
  messageStyle: ["bar", "card", "island"],
  messagePosition: [
    "bar-top",
    "bar-bottom",
    "top-center",
    "bottom-center",
    "left-top",
    "left-bottom",
    "right-top",
    "right-bottom",
  ],
  progressDirection: ["normal", "reverse", "decorative", "disabled"],
  islandMode: ["dynamic", "extended"],
  islandStyle: ["standard", "extended"],
  playerPlayMode: ["list", "shuffle", "single"],
  playerMusicSource: ["preset", "custom"],
  infoPosition: ["normal", "fixed"],
  weatherProvider: ["amap", "wttr", "openmeteo"],
  // "satellite" 已废弃（store 加载时迁移为 "ip"），白名单只留当前有效值
  weatherLocationMode: ["ip", "manual"],
  localSearchMode: ["off", "on", "always"],
};

// 颜色字段：只接受 #RRGGBB
const COLOR_KEYS = [
  "customPrimaryColor",
  "customSecondaryColor",
  "lastCustomPrimaryColor",
  "lastCustomSecondaryColor",
];

// 布尔字段：只接受布尔值（highContrast 是 false | true | "max" 三态，单独校验）
const BOOLEAN_KEYS = [
  "useRightMenu",
  "useCustomCursor",
  "playerShow",
  "playerAutoPlay",
  "islandPlayerSupport",
  "backgroundBlur",
  "customThemeEnabled",
  "customThemeBeforeHighContrast",
  "removeAnimations",
  "readingProgressEnabled",
  "hoverLineEnabled",
  "imageWebpEnabled",
  "weatherWidgetEnabled",
  "helloGithubWidgetEnabled",
  "tagsWidgetEnabled",
  "mobileWidgetsEnabled",
  "scheduledThemeEnabled",
  "islandUseThemeColor",
  "islandShowSeconds",
  "islandShowDate",
];

// 数值字段：范围校验（playerVolume 直接进 audio.volume，越界会抛 IndexSizeError）
const NUMBER_RULES = {
  fontSize: (v) => Number.isInteger(v) && v >= 10 && v <= 24,
  playerVolume: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1,
  messageDuration: (v) => Number.isInteger(v) && v >= 0 && v <= 60000,
  readingHistoryLimit: (v) => Number.isInteger(v) && v >= 0 && v <= 10000,
};

// 字符串格式字段
const isTimeHm = (v) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const STRING_RULES = {
  // 逗号分隔的数字歌单 ID；空串合法（允许清空），非空值不允许空段
  playerCustomIds: (v) =>
    typeof v === "string" && (!v.trim() || v.split(",").every((s) => /^\d+$/.test(s.trim()))),
  scheduledLightTime: isTimeHm,
  scheduledDarkTime: isTimeHm,
  weatherManualCity: (v) => typeof v === "string" && v.length <= 100,
};

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * 导入配置统一校验：非法值直接丢弃，让对应键回落到默认值
 * @param {object} filtered - pickPortable 之后的配置对象（原地修改）
 */
const sanitizeImportedConfig = (filtered) => {
  for (const [key, allowed] of Object.entries(ENUM_RULES)) {
    if (key in filtered && !allowed.includes(filtered[key])) {
      delete filtered[key];
    }
  }
  for (const key of COLOR_KEYS) {
    if (key in filtered && !isValidHexColor(filtered[key])) {
      delete filtered[key];
    }
  }
  for (const [key, ok] of Object.entries(NUMBER_RULES)) {
    if (key in filtered && !ok(filtered[key])) {
      delete filtered[key];
    }
  }
  for (const [key, ok] of Object.entries(STRING_RULES)) {
    if (key in filtered && !ok(filtered[key])) {
      delete filtered[key];
    }
  }
  if ("backgroundUrl" in filtered && !isHttpUrl(filtered.backgroundUrl)) {
    delete filtered.backgroundUrl;
  }
  for (const key of BOOLEAN_KEYS) {
    if (key in filtered && typeof filtered[key] !== "boolean") {
      delete filtered[key];
    }
  }
  if ("highContrast" in filtered) {
    const value = filtered.highContrast;
    if (value !== true && value !== false && value !== "max") {
      delete filtered.highContrast;
    }
  }
};

const pickPortable = (config) => {
  const filtered = {};
  for (const key of PORTABLE_CONFIG_KEYS) {
    if (config[key] !== undefined) {
      filtered[key] = config[key];
    }
  }
  return filtered;
};

/**
 * 配置导入/导出 composable
 * @param {string} siteVersion - 当前站点版本号，如 "V1.1"
 */
export const useConfigIO = (siteVersion = "V1.0") => {
  const importFileInput = ref(null);
  const importConfirmVisible = ref(false);
  const importWarnVisible = ref(false);
  const importWarnType = ref(""); // "high" | "low"
  const pendingImportConfig = ref(null);

  const handleExportConfig = () => {
    try {
      const siteData = safeStorage.getItem("siteData");
      if (!siteData) {
        if (typeof $message !== "undefined") {
          $message.error("没有可导出的配置数据");
        }
        return;
      }
      const exportData = {
        version: siteVersion,
        timestamp: new Date().toISOString(),
        config: pickPortable(JSON.parse(siteData)),
      };
      const encoded = obfuscate(JSON.stringify(exportData));
      const blob = new Blob([encoded], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `site-config-${new Date().toISOString().slice(0, 10)}.dat`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (typeof $message !== "undefined") {
        $message.success("配置已导出");
      }
    } catch (e) {
      if (typeof $message !== "undefined") {
        $message.error("导出配置失败");
      }
    }
  };

  const handleImportConfig = () => {
    importFileInput.value?.click();
  };

  const handleFileImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data;
        const content = e.target.result;
        // 尝试解码混淆格式
        try {
          data = JSON.parse(deobfuscate(content));
        } catch {
          // 尝试直接解析JSON（兼容旧格式）
          data = JSON.parse(content);
        }
        const importVersion = data.version;
        // 新格式存版本字符串；旧格式存坏编码的数字，走 legacy 通道
        const diff =
          typeof importVersion === "string"
            ? compareVersions(importVersion, siteVersion)
            : typeof importVersion === "number"
              ? importVersion - legacyVersionNumber(siteVersion)
              : 0;
        // 检查版本号
        if (diff > 0) {
          pendingImportConfig.value = data;
          importWarnType.value = "high";
          importWarnVisible.value = true;
          return;
        }
        if (diff < 0) {
          pendingImportConfig.value = data;
          importWarnType.value = "low";
          importWarnVisible.value = true;
          return;
        }
        // 版本相同，显示紫色确认警告
        pendingImportConfig.value = data;
        importConfirmVisible.value = true;
      } catch (e) {
        if (typeof $message !== "undefined") {
          $message.error("导入失败，请检查文件格式是否正确");
        }
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const applyImportConfig = (data) => {
    try {
      const config = data.config || data;
      const filtered = pickPortable(config);
      // 枚举/数值/颜色/URL/布尔统一校验：非法值丢弃，不写入 siteData
      sanitizeImportedConfig(filtered);
      // 导入后会刷新并重新水合，配置必须真正落进持久化存储；
      // 只挂账到会话内存（存储不可用/配额已满）会在 reload 后丢失，直接如实报错
      if (!safeStorage.setItem("siteData", JSON.stringify(filtered))) {
        if (typeof $message !== "undefined") {
          $message.error("导入失败：浏览器存储不可用，配置未保存");
        }
        return;
      }
      if (typeof $message !== "undefined") {
        $message.success("配置已导入，页面将刷新以应用设置", { duration: 3000 });
      }
      // 确认标记尽力而为：写失败只少一个导入后的确认弹窗，不回滚已保存的配置
      safeStorage.setItem("importJustCompleted", "true");
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (e) {
      if (typeof $message !== "undefined") {
        $message.error("导入失败，请检查文件格式是否正确");
      }
    }
  };

  const confirmImportWarn = () => {
    importWarnVisible.value = false;
    importConfirmVisible.value = true;
  };

  const cancelImportWarn = () => {
    importWarnVisible.value = false;
    pendingImportConfig.value = null;
  };

  const confirmImportConfirm = () => {
    importConfirmVisible.value = false;
    if (pendingImportConfig.value) {
      applyImportConfig(pendingImportConfig.value);
      pendingImportConfig.value = null;
    }
  };

  const cancelImportConfirm = () => {
    importConfirmVisible.value = false;
    pendingImportConfig.value = null;
  };

  return {
    importFileInput,
    importConfirmVisible,
    importWarnVisible,
    importWarnType,
    pendingImportConfig,
    handleExportConfig,
    handleImportConfig,
    handleFileImport,
    confirmImportWarn,
    cancelImportWarn,
    confirmImportConfirm,
    cancelImportConfirm,
  };
};
