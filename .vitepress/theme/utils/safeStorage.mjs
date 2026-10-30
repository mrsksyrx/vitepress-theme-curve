// localStorage 安全适配器：所有读写都捕获 SecurityError / QuotaExceededError。
// 隐私模式或禁用 Cookie 的浏览器在「访问 window.localStorage」这一步就可能抛
// SecurityError（typeof localStorage 也救不了），写满时抛 QuotaExceededError。
//
// 降级语义：memoryFallback 是会话内「未持久化写入」的挂账覆盖层：
// - setItem 持久化成功 → 清掉该键挂账，后续读取（含跨标签页）走真实存储；
//   失败或存储不可用 → 值记入挂账，getItem 优先返回它。
//   读取绝不能在挂账存在时回退读 localStorage：否则「配额失败的那次写入」
//   会被旧值覆盖（set v1 成功、set v2 失败后 get 必须得到 v2）。
// - removeItem / clear 两边同时清理。
// 存储完全不可用时，读写退化为会话内内存；getItem 失败按缺失处理，不向调用方抛异常。
const memoryFallback = new Map();

// 访问 localStorage 属性本身可能抛 SecurityError，只能包在 try 里取
const getStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const safeStorage = {
  getItem(key) {
    if (memoryFallback.has(key)) return memoryFallback.get(key);
    const storage = getStorage();
    if (storage) {
      try {
        return storage.getItem(key);
      } catch {
        // 读失败按缺失处理
      }
    }
    return null;
  },
  /**
   * @returns {boolean} true = 已写入持久化存储；false = 仅落在会话内存挂账
   */
  setItem(key, value) {
    const str = String(value);
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(key, str);
        // 持久化成功后清掉挂账，让后续读取走真实存储
        memoryFallback.delete(key);
        return true;
      } catch {
        // QuotaExceededError / SecurityError：值挂账到内存
      }
    }
    memoryFallback.set(key, str);
    return false;
  },
  removeItem(key) {
    const storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(key);
      } catch {
        // 存储不可用时没有需要移除的持久化数据
      }
    }
    memoryFallback.delete(key);
  },
  clear() {
    const storage = getStorage();
    if (storage) {
      try {
        storage.clear();
      } catch {
        // 同上
      }
    }
    memoryFallback.clear();
  },
};

export default safeStorage;
