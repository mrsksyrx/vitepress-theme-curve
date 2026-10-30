import { mainStore } from "@/store";
import { throttle } from "lodash-es";

/**
 * 计算滚动高度和滚动百分比
 */
export const calculateScroll = throttle(
  () => {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") return false;
      const store = mainStore();
      const scrollY = window.scrollY || window.pageYOffset;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      // 无滚动空间时（内容不足一屏）视为 0%，避免除以 0 得到 NaN/Infinity
      const raw = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;
      const scrollPercentage = Math.min(Math.max(raw, 0), 100).toFixed(0);
      // 判断滚动方向
      const scrollDirection = scrollY > store.scrollData.height ? "down" : "up";
      // 储存计算结果
      store.scrollData = {
        height: Number(scrollY.toFixed(0)),
        percentage: Number(scrollPercentage),
        direction: scrollDirection,
      };
    } catch (error) {
      console.error("计算滚动时出现错误：", error);
    }
  },
  300,
  true,
);

/**
 * 滚动到元素位置（带顶栏偏移）
 * rect.top 相对视口，必须换算成文档坐标后再 scrollTo，否则滚动过页面后会算错位置
 */
const scrollToElement = (element) => {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const top = Math.max(0, scrollY + element.getBoundingClientRect().top - 80);
  window.scrollTo({ top, behavior: "smooth" });
};

/**
 * 平滑滚动至目标高度或元素
 * @param {number|HTMLElement} target - 目标高度或元素
 */
export const smoothScrolling = (target = 0) => {
  try {
    if (typeof window === "undefined") return false;
    if (typeof target === "number") {
      // 滚动至指定高度
      window.scrollTo({ top: target, behavior: "smooth" });
    } else if (target instanceof HTMLElement) {
      // 滚动至元素
      scrollToElement(target);
    } else if (typeof target === "string" && target.startsWith("#")) {
      // 滚动至 ID
      const element = document.querySelector(target);
      if (element) {
        scrollToElement(element);
      }
    } else {
      // 滚动至顶部
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } catch (error) {
    console.error("平滑滚动出错：", error);
  }
};

/**
 * 统一导航链接处理（Nav.vue / MobileMenu.vue 共用）
 * - http: / https: 外部链接新标签打开
 * - mailto: / tel: / sms: 交给浏览器协议处理
 * - #hash 同页锚点：合成 <a> 点击交给 VitePress 拦截器，与原生锚点行为一致
 * - 站内路径继续走 VitePress router
 * - javascript: 等未知协议拒绝执行
 * @param {string} link - 目标链接
 * @param {object} router - VitePress router
 * @returns {boolean} 是否已处理
 */
export const handleNavLink = (link, router) => {
  if (typeof link !== "string") return false;
  const url = link.trim();
  if (!url) return false;
  // 同页锚点：合成 <a> 点击交给 VitePress 的链接拦截器处理。
  // 拦截器会 pushState({}) 并按锚点滚动，后退 / 前进也按锚点位置恢复；
  // 手工 pushState 透传的 state 里带 scrollPosition 时会按入栈前位置恢复，对不齐原生行为
  if (url.startsWith("#")) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  }
  // 协议相对 URL 视为外部链接
  if (url.startsWith("//")) {
    window.open(`https:${url}`, "_blank", "noopener,noreferrer");
    return true;
  }
  // 站内路径（含相对路径）
  if (url.startsWith("/") || !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    // 同源静态资源（rss.xml 等，可能带 query/hash）交给浏览器加载，router.go 只会渲染出 404
    const filePath = url.split(/[?#]/)[0];
    if (url.startsWith("/") && /\.(xml|json|pdf|txt|zip)$/i.test(filePath)) {
      window.location.href = url;
      return true;
    }
    router.go(url);
    return true;
  }
  const protocol = url.slice(0, url.indexOf(":")).toLowerCase();
  if (protocol === "http" || protocol === "https") {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  if (protocol === "mailto" || protocol === "tel" || protocol === "sms") {
    // 交给浏览器协议处理器
    window.location.href = url;
    return true;
  }
  // javascript: 等未知协议拒绝执行
  return false;
};

/**
 * 计算给定日期与当前日期相差的天数
 * @param {string} dateStr - 要计算差值的日期，为字符串形式
 * @returns {number} 天数差值
 */
export const daysFromNow = (dateStr) => {
  const currentDate = new Date();
  const inputDate = new Date(dateStr);
  const timeDiff = currentDate - inputDate;
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return dayDiff;
};

/**
 * 随机前往一篇文章
 * @param {Object} postData - 文章数据
 * @returns {string} 随机文章的路径
 */
let lastIndex = -1;
export const shufflePost = (postData) => {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * postData.length);
  } while (randomIndex === lastIndex && postData.length > 1);
  lastIndex = randomIndex;
  return postData[randomIndex].regularPath;
};

/**
 * 复制文本到剪贴板
 * @param {string} data 要复制到剪贴板的文本
 */
export const copyText = async (data) => {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data);
      if (typeof $message !== "undefined") {
        $message.success("复制成功，在转载时请标注本文地址");
      }
    } catch (error) {
      console.error("复制出错：", error);
      if (typeof $message !== "undefined") {
        $message.error("复制出现错误，请重试");
      }
    }
  } else {
    // 如果浏览器不支持 navigator.clipboard
    const textArea = document.createElement("textarea");
    textArea.value = data;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      if (typeof $message !== "undefined") {
        $message.success("复制成功，在转载时请标注本文地址");
      }
    } catch (err) {
      console.error("复制出错：", err);
      if (typeof $message !== "undefined") {
        $message.error("复制出现错误，请重试");
      }
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * 图片 URL 复制到剪贴板
 * @param {string} imageURL 要复制到剪贴板的图片的URL
 */
export const copyImage = async (imageURL) => {
  if (!navigator.clipboard) {
    console.error("浏览器不支持 Clipboard API");
    if (typeof $message !== "undefined") {
      $message.error("当前浏览器不支持复制图片");
    }
    return;
  }
  try {
    const response = await fetch(imageURL);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    if (typeof $message !== "undefined") {
      $message.success("图片已复制到剪贴板");
    }
  } catch (error) {
    console.error("复制图片出错：", error);
    if (typeof $message !== "undefined") {
      $message.error("复制图片错误，请重试");
    }
  }
};

/**
 * 下载图片
 * @param {string} imageUrl 要下载的图片的URL地址
 */
export const downloadImage = async (imageUrl) => {
  try {
    // 同源或允许 CORS 的图片可以读取 Blob，此时 download 属性可稳定生效。
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`image request failed: ${response.status}`);
    const blob = await response.blob();

    // blob.type 是实际内容类型；URL 扩展名只作为无 MIME 或未知 MIME 时的兜底。
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const isImageMime = blob.type.startsWith("image/");
    const mimeSubtype = blob.type.split("/")[1]?.split(";")[0]?.toLowerCase();
    const mimeExt = !isImageMime
      ? ""
      : mimeSubtype === "svg+xml"
        ? "svg"
        : mimeSubtype === "x-icon" || mimeSubtype === "vnd.microsoft.icon"
          ? "ico"
          : mimeSubtype;
    const extMatch = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(imageUrl);
    const urlExt = extMatch ? extMatch[1].toLowerCase() : "";
    const ext = mimeExt && /^[a-z0-9]+$/.test(mimeExt) ? mimeExt : urlExt || "jpg";
    const imageName = `image-${timestamp}.${ext}`;

    const objectUrl = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement("a");
      anchor.download = imageName;
      anchor.href = objectUrl;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      // 下载任务启动是异步的；Firefox 过早 revoke 会让 blob 下载直接失败。
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }
    if (typeof $message !== "undefined") {
      $message.success("图片已开始下载");
    }
  } catch (error) {
    // 跨域图片若未开放 CORS，浏览器无法读取响应内容；只能安全地打开原图降级。
    console.warn("无法直接下载图片，已降级为新标签页打开：", error);
    window.open(imageUrl, "_blank", "noopener,noreferrer");
    if (typeof $message !== "undefined") {
      $message.warning("该图片受跨域限制，无法直接下载，已在新标签页打开");
    }
  }
};

/**
 * 获取根据当前时间的问候语
 * @returns {string} 当前时间对应的问候语
 */
export const getGreetings = () => {
  const hour = new Date().getHours();
  let hello;
  if (hour < 6) {
    hello = "凌晨好，夜深了。";
  } else if (hour < 9) {
    hello = "早上好，昨晚睡得怎么样？";
  } else if (hour < 12) {
    hello = "上午好，今天也要加油哦！";
  } else if (hour < 14) {
    hello = "中午好，吃饱了精神好！";
  } else if (hour < 17) {
    hello = "下午好，继续加油！";
  } else if (hour < 19) {
    hello = "傍晚好，是时候放松一下了！";
  } else if (hour < 22) {
    hello = "晚上好，是时候休息了！";
  } else {
    hello = "夜深了，明天继续加油！";
  }
  return hello;
};

// 打乱数组 - Fisher-Yates 洗牌算法
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // 解构赋值进行元素互换
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// 特殊纪念日置灰
export const specialDayGray = () => {
  const specialDays = [
    { date: "4-4", name: "清明节" },
    { date: "5-12", name: "汶川大地震纪念日" },
    { date: "7-7", name: "中国人民抗日战争纪念日" },
    { date: "9-18", name: "九·一八事变纪念日" },
    { date: "11-20", name: "跨性别追念日" },
    { date: "12-13", name: "南京大屠杀死难者国家公祭日" },
  ];
  // 获取当天日期
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const currentDate = `${month}-${day}`;
  // 查找纪念日
  const specialDay = specialDays.find((day) => day.date === currentDate);
  if (specialDay) {
    document.documentElement.classList.add("gray");
    if (typeof $message !== "undefined") {
      $message.info(`今天是${specialDay.name}，特此默哀`, {
        duration: 8000,
        close: true,
      });
    }
  }
};
