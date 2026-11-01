// 设置面板“恢复默认配置 / 清除所有数据”的跨刷新写保护。
//
// location.reload() 只是发起导航，并不会同步卸载当前页面；Pinia 的持久化订阅
// 仍可能在导航提交前把内存状态写回 localStorage。刷新后的首次初始化也会写入
// 版本迁移标记和少量默认项。重置标记同时解决这两个窗口：
// - markStorageReset() 从本次调用起禁止持久化写入，并把模式带到下一次加载；
// - 下一次加载消费标记，在 App 初始化完成前继续禁止持久化写入；
// - “清除所有数据”还要求跳过本次刷新的 PWA 注册，避免 SW / Cache 立即复活。
const RESET_STORAGE_KEY = "__curve_storage_reset";
export const RESET_MODE_CONFIG = "config";
export const RESET_MODE_ALL = "all";

const getSessionStorage = () => {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
};

const consumeInitialResetMode = () => {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const mode = storage.getItem(RESET_STORAGE_KEY);
    storage.removeItem(RESET_STORAGE_KEY);
    return mode === RESET_MODE_CONFIG || mode === RESET_MODE_ALL ? mode : null;
  } catch {
    return null;
  }
};

let resetMode = consumeInitialResetMode();
let skipPwaRegistration = resetMode === RESET_MODE_ALL;

export const isStorageWriteBlocked = () => resetMode !== null;

export const markStorageReset = (mode = RESET_MODE_CONFIG) => {
  resetMode = mode === RESET_MODE_ALL ? RESET_MODE_ALL : RESET_MODE_CONFIG;
  skipPwaRegistration = resetMode === RESET_MODE_ALL;
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(RESET_STORAGE_KEY, resetMode);
  } catch {
    // 会话存储不可用时仍保护当前页面的写入，只是无法跨刷新延续
  }
};

export const consumeSkipPwaRegistration = () => {
  const shouldSkip = skipPwaRegistration;
  skipPwaRegistration = false;
  return shouldSkip;
};

export const finishStorageReset = () => {
  resetMode = null;
  skipPwaRegistration = false;
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(RESET_STORAGE_KEY);
  } catch {
    // 标记通常已在加载时消费，删除失败不影响后续写入
  }
};
