import { load } from "cheerio";

// src/href → 加载 Promise。共享加载状态：标签已插入但尚未 load 完成时，
// 后续调用挂到同一 Promise 上，而不是同步回调（那时全局对象往往还没就绪）。
const scriptLoads = new Map();
const styleLoads = new Map();

/**
 * 动态加载脚本
 * @param {string} src - 脚本 URL
 * * @param {object} option - 配置
 */
export const loadScript = (src, option = {}) => {
  // 获取配置
  const { async = false, reload = false, callback } = option;
  if (typeof document === "undefined" || !src) {
    // 早退也要 settle：callback 型调用方拿到具体原因，await 型调用方靠
    // rejected Promise 拿到同一原因。空 catch 兼容忽略返回值的调用点。
    const error = new Error(`loadScript: 无效的 src（${src}）或非浏览器环境`);
    callback && callback(error);
    const rejected = Promise.reject(error);
    rejected.catch(() => {});
    return rejected;
  }
  if (reload) {
    document.querySelector(`script[src="${src}"]`)?.remove();
    scriptLoads.delete(src);
  } else if (scriptLoads.has(src)) {
    // 已在加载或已完成：挂到同一 Promise，绝不走同步回调
    const pending = scriptLoads.get(src);
    pending.then(
      (s) => callback && callback(null, s),
      (e) => callback && callback(e),
    );
    return pending;
  } else {
    // 非本模块插入的既有标签，查不到加载状态
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      // [B26-旧] 原实现：同步回调成功，但脚本可能尚未执行完
      // callback && callback(null, existingScript);
      // return false;
      // [B26] 不再同步假成功：等标签真正就绪再回调。判定顺序：
      // 1) 本模块 onload 打过的 data-loaded 标记 → 已执行完；
      // 2) 解析器插入的同步脚本（无 async/defer）在 DOMContentLoaded 前必然执行完，
      //    文档已过加载期即可视为就绪；仍在加载期则挂 DOMContentLoaded 兜底；
      // 3) 其余（动态插入 / async）挂 load/error 事件等待。
      const promise = new Promise((resolve, reject) => {
        const settle = () => {
          existingScript.dataset.loaded = "true";
          resolve(existingScript);
        };
        if (existingScript.dataset.loaded === "true") return settle();
        const isClassic =
          !existingScript.async &&
          !existingScript.defer &&
          existingScript.getAttribute("async") === null &&
          existingScript.getAttribute("defer") === null;
        if (isClassic && document.readyState !== "loading") return settle();
        existingScript.addEventListener("load", settle, { once: true });
        existingScript.addEventListener("error", (error) => reject(error), { once: true });
        if (isClassic) {
          document.addEventListener("DOMContentLoaded", settle, { once: true });
        }
      });
      // 与新插入路径一致：登记共享加载状态，后续调用挂到同一 Promise
      scriptLoads.set(src, promise);
      promise.catch(() => {});
      if (callback) {
        promise.then(
          (s) => callback(null, s),
          (e) => callback(e),
        );
      }
      return promise;
    }
  }
  // 创建一个新的script标签并加载
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    if (async) script.async = true;
    script.onload = () => {
      // 打就绪标记：标签若被外部再次命中（既有标签分支）可据此判定已执行完
      script.dataset.loaded = "true";
      resolve(script);
    };
    script.onerror = (error) => {
      // 清掉残留标签，否则下次调用会命中死标签、永远无法重试
      script.remove();
      // 只清掉自己这一条：若期间发生过 reload，缓存里已是更新的 Promise，
      // 不能把人家的记录误删，否则新加载会失去共享状态
      if (scriptLoads.get(src) === promise) scriptLoads.delete(src);
      reject(error);
    };
    document.head.appendChild(script);
  });
  scriptLoads.set(src, promise);
  // callback-only 的调用方不 await 该 Promise，先挂空 catch 避免 unhandled rejection
  promise.catch(() => {});
  if (callback) {
    promise.then(
      (s) => callback(null, s),
      (e) => callback(e),
    );
  }
  return promise;
};

/**
 * 动态加载样式表
 * @param {string} href - 样式表 URL
 * @param {object} option - 配置
 */
export const loadCSS = (href, option = {}) => {
  // 获取配置
  const { reload = false, callback } = option;
  if (typeof document === "undefined" || !href) {
    // 与 loadScript 同理：早退也要 settle，保持通道完整
    const error = new Error(`loadCSS: 无效的 href（${href}）或非浏览器环境`);
    callback && callback(error);
    const rejected = Promise.reject(error);
    rejected.catch(() => {});
    return rejected;
  }
  if (reload) {
    document.querySelector(`link[href="${href}"]`)?.remove();
    styleLoads.delete(href);
  } else if (styleLoads.has(href)) {
    const pending = styleLoads.get(href);
    pending.then(
      (l) => callback && callback(null, l),
      (e) => callback && callback(e),
    );
    return pending;
  } else {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      callback && callback(null, existingLink);
      return false;
    }
  }
  // 创建新的link标签并设置属性
  const promise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.href = href;
    link.rel = "stylesheet";
    link.type = "text/css";
    link.onload = () => resolve(link);
    link.onerror = (error) => {
      link.remove();
      if (styleLoads.get(href) === promise) styleLoads.delete(href);
      reject(error);
    };
    document.head.appendChild(link);
  });
  styleLoads.set(href, promise);
  promise.catch(() => {});
  if (callback) {
    promise.then(
      (l) => callback(null, l),
      (e) => callback(e),
    );
  }
  return promise;
};

// ===== 不蒜子（busuanzi）计数缓存 =====
// 不蒜子脚本只打一次点：SPA 切换路由会重挂 #busuanzi_value_* 节点，
// 旧方案用 reload:true 强制重新插脚本再打点，导致 site_pv 虚高。
// 改为包裹全局 bszTag.texts 捕获 JSONP 计数结果（模块级缓存），
// 组件重挂后直接把缓存写回新节点，同一会话内只打一次点。

// 只缓存站点级计数；page_pv 是页面级的，回填到别的页面会显示错误数字
const busuanziCounts = Object.create(null);
const BUSUANZI_CACHE_KEYS = ["site_pv", "site_uv"];

// 不蒜子脚本执行后暴露全局 bszTag.texts(data)，data 即 JSONP 返回的计数对象。
// 包一层先缓存再交给原函数回填：即使节点已随组件卸载不存在，也能拿到数值。
const wrapBusuanziTexts = () => {
  const tag = typeof window === "undefined" ? null : window.bszTag;
  if (!tag || typeof tag.texts !== "function" || tag.texts.__busuanziCountWrapped) return false;
  const rawTexts = tag.texts;
  const wrappedTexts = function (data) {
    BUSUANZI_CACHE_KEYS.forEach((key) => {
      if (data && data[key] !== undefined) busuanziCounts[key] = data[key];
    });
    return rawTexts.call(this, data);
  };
  wrappedTexts.__busuanziCountWrapped = true;
  tag.texts = wrappedTexts;
  return true;
};

/**
 * 把缓存的计数写回当前文档中的计数节点（组件重挂后的新节点）
 * @returns {boolean} 是否命中缓存（false = 尚未打过点，需要走 loadScript）
 */
export const applyBusuanziCounts = () => {
  if (typeof document === "undefined") return false;
  const keys = Object.keys(busuanziCounts);
  if (keys.length === 0) return false;
  keys.forEach((key) => {
    const el = document.getElementById(`busuanzi_value_${key}`);
    // 与 bszTag.texts 原实现保持一致用 innerHTML 写入
    if (el) el.innerHTML = busuanziCounts[key];
  });
  // 容器显隐交给原逻辑（没有 busuanzi_container_* 节点时是空操作）
  const tag = typeof window === "undefined" ? null : window.bszTag;
  if (tag && typeof tag.shows === "function") tag.shows();
  return true;
};

/**
 * 确保站点计数可用：命中缓存直接回填；否则加载脚本并包裹 bszTag.texts 捕获结果。
 * 全程不使用 reload，同一会话内脚本与打点只发生一次。
 * @param {string} src - 不蒜子脚本地址
 * @returns {Promise<boolean>} 是否由缓存回填
 */
export const ensureBusuanziCounts = (src) => {
  // 脚本若此前已加载（bszTag 已存在），先补包裹，避免缓存被绕过
  wrapBusuanziTexts();
  if (applyBusuanziCounts()) return Promise.resolve(true);
  // 已在加载/已加载也走这里：loadScript 内部共享同一 Promise，不会重复打点
  return loadScript(src, {
    async: true,
    callback: () => wrapBusuanziTexts(),
  }).then(
    () => {
      wrapBusuanziTexts();
      return false;
    },
    () => false,
  );
};

// 始终排除的域名（含子域），这些域名的链接不走中转页
const ALWAYS_EXCLUDE_DOMAINS = ["sgexilq.com", "sgexilq.top", "mrsksyrx.top", "20091010.xyz"];

/**
 * 判断链接是否应跳过中转（相对路径/同源、非 http(s) 协议，或命中始终排除的域名）
 * @param {string} href
 */
const shouldSkipRedirect = (href) => {
  try {
    const url = new URL(href, "https://placeholder.local");
    // 相对路径解析为 placeholder.local 即同源
    if (url.origin === "https://placeholder.local") return true;
    // 仅 http/https 走中转：javascript:/data: 等伪协议、mailto:/tel: 等应用协议
    // 一律原样保留——包进中转页只会被 redirect.html 的协议白名单拦成死链
    if (url.protocol !== "http:" && url.protocol !== "https:") return true;
    return ALWAYS_EXCLUDE_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith("." + d));
  } catch {
    return true;
  }
};

/**
 * UTF-8 安全的 Base64 编码。
 * 必须与 redirect.html 里的解码保持对称：那边是 atob + TextDecoder，
 * 任一侧改回裸 btoa/atob 都会让非 Latin1 URL 变成乱码跳转。
 * @param {string} str
 */
const toBase64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

/**
 * 跳转中转页
 * @param {string} html - 页面内容
 * @param {boolean} isDom - 是否为 DOM 对象
 */
export const jumpRedirect = (html, themeConfig, isDom = false) => {
  try {
    // 是否为开发环境
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) return false;
    // 是否启用
    if (!themeConfig.jumpRedirect.enable) return html;
    // 中转页地址
    const redirectPage = "/redirect.html";
    // 排除的 className
    const excludeClass = themeConfig.jumpRedirect.exclude;
    if (isDom) {
      if (typeof window === "undefined" || typeof document === "undefined") return false;
      // 所有链接
      const allLinks = [...document.getElementsByTagName("a")];
      if (allLinks?.length === 0) return false;
      allLinks.forEach((link) => {
        // 单条失败不拖垮整轮改造
        try {
          // 检查链接是否包含 target="_blank" 属性
          if (link.getAttribute("target") === "_blank") {
            // 检查链接是否包含排除的类
            if (excludeClass.some((className) => link.classList.contains(className))) {
              return;
            }
            const linkHref = link.getAttribute("href");
            // 同源 / 白名单域名 / 非 http(s) 协议不走中转
            if (linkHref && shouldSkipRedirect(linkHref)) return;
            // 存在链接且非中转页
            if (linkHref && !linkHref.includes(redirectPage)) {
              // Base64
              const encodedHref = toBase64(linkHref);
              const redirectLink = `${redirectPage}#url=${encodedHref}`;
              // 保存原始链接
              link.setAttribute("original-href", linkHref);
              // 覆盖 href
              link.setAttribute("href", redirectLink);
            }
          }
        } catch (error) {
          console.error("处理单条链接时出错：", error);
        }
      });
    } else {
      const $ = load(html);
      // 替换符合条件的标签
      $("a[target='_blank']").each((_, el) => {
        const $a = $(el);
        const href = $a.attr("href");
        const classesStr = $a.attr("class");
        // 保留嵌套图标/图片（text() 会丢弃子元素）
        const innerHtml = $.html($a.contents());
        // 检查是否包含排除的类
        const classes = classesStr ? classesStr.trim().split(" ") : [];
        if (excludeClass.some((className) => classes.includes(className))) {
          return;
        }
        // 同源 / 白名单域名 / 非 http(s) 协议不走中转
        if (href && shouldSkipRedirect(href)) return;
        // 存在链接且非中转页
        if (href && !href.includes(redirectPage)) {
          // Base64 编码 href
          const encodedHref = toBase64(href);
          // 获取所有属性（排除 href / original-href，稍后单独写入）
          const attributes = el.attribs;
          // 转义属性值中的 HTML 特殊字符
          const escapeAttr = (s) =>
            String(s)
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
          // 重构属性字符串，保留原有属性
          let attributesStr = "";
          for (let attr in attributes) {
            if (Object.prototype.hasOwnProperty.call(attributes, attr)) {
              if (attr === "href" || attr === "original-href") continue;
              attributesStr += ` ${attr}="${escapeAttr(attributes[attr])}"`;
            }
          }
          // 构造新标签
          const newLink = `<a href="${redirectPage}#url=${encodedHref}" original-href="${escapeAttr(href)}" ${attributesStr}>${innerHtml}</a>`;
          // 替换原有标签
          $a.replaceWith(newLink);
        }
      });
      return $.html();
    }
  } catch (error) {
    console.error("处理链接时出错：", error);
  }
};

// body 滚动锁引用计数（多弹窗并发时互相踩踏）
let bodyScrollLockCount = 0;

export const lockBodyScroll = () => {
  bodyScrollLockCount += 1;
  if (bodyScrollLockCount === 1 && typeof document !== "undefined") {
    document.body.style.overflowY = "hidden";
  }
};

export const unlockBodyScroll = () => {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0 && typeof document !== "undefined") {
    document.body.style.overflowY = "";
  }
};
