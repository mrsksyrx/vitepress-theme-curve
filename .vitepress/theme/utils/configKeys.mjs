// 持久化键（store persist paths 的唯一来源，防止 useConfigIO 白名单再漂移）
export const PERSIST_PATHS = [
  "themeType",
  "themeColor",
  "bannerType",
  "useRightMenu",
  "useCustomCursor",
  "playerShow",
  "playerAutoPlay",
  "playerPlayMode",
  "playerMusicSource",
  "playerCustomIds",
  "playerVolume",
  "islandPlayerSupport",
  "islandStyle",
  "backgroundBlur",
  "backgroundType",
  "fontFamily",
  "fontSize",
  "fontSizePending",
  "infoPosition",
  "backgroundUrl",
  "highContrast",
  "siteLayout",
  "siteLayoutPending",
  "lastSiteLayout",
  "messageStyle",
  "messagePosition",
  "progressDirection",
  "messageDuration",
  "islandMode",
  "islandUseThemeColor",
  "islandShowSeconds",
  "islandShowDate",
  "customThemeEnabled",
  "customPrimaryColor",
  "customSecondaryColor",
  "lastCustomPrimaryColor",
  "lastCustomSecondaryColor",
  "customThemeBeforeHighContrast",
  "removeAnimations",
  "localSearchMode",
  "readingHistoryLimit",
  "readingProgressEnabled",
  "hoverLineEnabled",
  "imageWebpEnabled",
  "weatherProvider",
  "weatherLocationMode",
  "weatherManualCity",
  "weatherWidgetEnabled",
  "helloGithubWidgetEnabled",
  "tagsWidgetEnabled",
  "mobileWidgetsEnabled",
  "scheduledThemeEnabled",
  "scheduledLightTime",
  "scheduledDarkTime",
  // 站点版本/构建信息是构建期常量，以当前构建为准，不持久化（否则老访客被旧值水合盖住）
];

// 不参与配置导入/导出往返的键：
// - 站点元数据：以当前构建为准，从旧配置回放会覆盖掉当前版本信息
// - 一次性 UI 标志：next-render 用完即弃，跨浏览器迁移没有意义
const NON_PORTABLE_KEYS = ["fontSizePending", "siteLayoutPending"];

// [B36] aside.hello.text 为有意 HTML（themeConfig 构建期注入），勿加入持久化/导入白名单
// 可迁移的用户配置 = 持久化键 - 非迁移键
export const PORTABLE_CONFIG_KEYS = PERSIST_PATHS.filter((k) => !NON_PORTABLE_KEYS.includes(k));
