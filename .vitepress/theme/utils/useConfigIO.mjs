import { ref } from "vue";
import { PORTABLE_CONFIG_KEYS } from "./configKeys.mjs";

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

// 自定义主题色仅接受 3-8 位十六进制，与 cursor.js 的 setCursorColor 白名单一致
const isValidHexColor = (value) => typeof value === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(value);

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
      const siteData = localStorage.getItem("siteData");
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
      // 导入的 customPrimaryColor 会流入光标样式 innerHTML / CSS 变量，非法值直接丢弃
      if ("customPrimaryColor" in filtered && !isValidHexColor(filtered.customPrimaryColor)) {
        delete filtered.customPrimaryColor;
      }
      localStorage.setItem("siteData", JSON.stringify(filtered));
      if (typeof $message !== "undefined") {
        $message.success("配置已导入，页面将刷新以应用设置", { duration: 3000 });
      }
      localStorage.setItem("importJustCompleted", "true");
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
