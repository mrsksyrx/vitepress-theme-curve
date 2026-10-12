import { loadScript, loadCSS } from "./commonTools.mjs";

// 库就绪判定：经 globalThis 取值（未定义时是 undefined，不会 ReferenceError），
// 兼容 object / function 两种导出形态
const isReady = (lib) => !!lib && typeof lib.init === "function";

const initComments = async (themeConfig) => {
  try {
    // 必要数据
    const option = themeConfig.comment;
    const commentType = option.type;
    if (!option.enable) return false;
    switch (commentType) {
      case "artalk": {
        // 只有 artalk 用 server；提到 case 内避免 type 拼错时在 switch 之前就抛
        const server = option.artalk.server;
        // 引入资源
        await loadCSS(`${server}/dist/Artalk.css`);
        await loadScript(`${server}/dist/Artalk.js`);
        if (isReady(globalThis.Artalk)) return globalThis.Artalk;
        throw new Error("Artalk 初始化失败");
      }
      case "twikoo": {
        // 引入资源
        await loadScript(option.twikoo.js);
        if (isReady(globalThis.twikoo)) return globalThis.twikoo;
        throw new Error("Twikoo 初始化失败");
      }
      default:
        console.warn(`未知的评论服务类型：${commentType}，已跳过初始化`);
        return false;
    }
  } catch (error) {
    // 注意：不能用 try 块里的 `commentType` —— 它声明在 try 内，
    // 一旦在 try 的早期（如读取 option 时）抛错，catch 里引用它会抛
    // ReferenceError，把真实的失败原因（例如 CDN 加载失败）整个吞掉。
    // 这里直接从参数里取，缺失时给一个中性名字。
    console.error(`${themeConfig?.comment?.type ?? "评论"} 初始化失败`, error);
    throw error;
  }
};

export default initComments;
