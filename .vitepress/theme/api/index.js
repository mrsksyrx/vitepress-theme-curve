/**
 * 获取一言
 * @param {string} [rule="updated"] - 文章的排序规则，可以是 "created" 或 "updated"
 */
let useFallbackAPI = false; // 跟踪是否使用备用 API

export const getHitokoto = async () => {
  const primaryUrl = "https://v1.hitokoto.cn/";
  const fallbackUrl = "https://international.v1.hitokoto.cn/";

  try {
    // 如果已切换到备用 API，直接使用备用 API
    const url = useFallbackAPI ? fallbackUrl : primaryUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const hitokoto = await response.json();
    return hitokoto;
  } catch (error) {
    console.error(`获取一言失败 (${useFallbackAPI ? "备用 API" : "主 API"})：`, error);
    if (!useFallbackAPI) {
      // 主 API 失败，切换到备用 API
      useFallbackAPI = true;
      // 递归调用以使用备用 API
      return await getHitokoto();
    }
    // 备用 API 也失败，抛出错误
    throw error;
  }
};

/**
 * 获取给定网址的站点图标和描述
 * @param {string} url - 站点 URL
 * @returns {Promise<{iconUrl: string, description: string}>}
 */
export const getSiteInfo = async (url) => {
  const details = {
    iconUrl: null,
    title: null,
    description: null,
  };
  // 浏览器同源策略下跨域 fetch 必被 CORS 拦截（目标站不返 Access-Control-Allow-Origin 即 TypeError），
  // 对外链抓取没有意义，直接跳过避免控制台报错。外链请手动传 title/desc/icon。
  try {
    const resolved = new URL(url, window.location.href);
    if (resolved.origin !== window.location.origin) return details;
    // 站点数据
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    // 获取页面标题
    const titleElement = doc.querySelector("title");
    details.title = titleElement ? titleElement.textContent : "暂无标题";
    // 获取 icon
    let iconLink =
      doc.querySelector("link[rel='shortcut icon']") || doc.querySelector("link[rel='icon']");
    if (iconLink) {
      details.iconUrl = new URL(iconLink.getAttribute("href"), url).href;
    } else {
      details.iconUrl = new URL("/favicon.ico", url).href;
    }
    // 获取描述
    const metaDescription = doc.querySelector("meta[name='description']");
    details.description = metaDescription ? metaDescription.content : "暂无站点描述";
  } catch (error) {
    console.error("获取站点信息失败：", error);
  }
  return details;
};

/**
 * Meting
 * @param {id} string - 歌曲ID
 * @param {server} string - 服务器
 * @param {type} string - 类型
 * @returns {Promise<Object>} - 音乐详情
 */
export const getMusicList = async (url, id, server = "netease", type = "playlist") => {
  const ids = Array.isArray(id) ? id : [id];
  // allSettled：单个 id 失败（404/非 JSON）不应拖垮整份歌单，保留成功的条目
  const results = await Promise.allSettled(
    ids.map((pid) =>
      fetch(`${url}?server=${server}&type=${type}&id=${pid}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ),
  );
  const merged = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .flat();
  // 按 id 去重
  const seen = new Set();
  return merged
    .filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    })
    .map((song) => {
      const { pic, ...data } = song;
      return { ...data, cover: pic };
    });
};

// 站点统计数据（51.la）——当前未被任何组件调用（站点统计走 busuanzi），保留备用。
// 注意：data.match 失败时返回 null，下面 num.map 会抛 TypeError；title 7 项与 num 长度无对齐。
// export const getStatistics = async (key) => {
//   const result = await fetch(`https://v6-widget.51.la/v6/${key}/quote.js`);
//   const title = [
//     "最近活跃",
//     "今日人数",
//     "今日访问",
//     "昨日人数",
//     "昨日访问",
//     "本月访问",
//     "总访问量",
//   ];
//   const data = await result.text();
//   let num = data.match(/(<\/span><span>).*?(\/span><\/p>)/g);
//   num = num.map((el) => {
//     const val = el.replace(/(<\/span><span>)/g, "");
//     return val.replace(/(<\/span><\/p>)/g, "");
//   });
//   const statistics = {};
//   for (let i = 0; i < num.length; i++) {
//     if (i === num.length - 1) continue;
//     statistics[title[i]] = num[i];
//   }
//   return statistics;
// };

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取 wttr.in 天气信息（无需 API Key）
export const getWeatherWttr = async (city) => {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
  return await res.json();
};

// 获取 Open-Meteo 天气信息（无需 API Key，需要经纬度）
export const getWeatherOpenMeteo = async (lat, lon) => {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code`,
  );
  return await res.json();
};

// 根据经纬度获取城市名（Nominatim 逆地理编码）
// 注意：Nominatim 要求标识调用方的 User-Agent，并限流 1 req/s（请勿高频轮询）；
// 浏览器端 fetch 禁止覆盖 User-Agent（forbidden header），此处仅为非浏览器环境/文档意图保留。
// Open-Meteo 的 /v1/search 不支持按经纬度逆地理（name= 为空时恒返回空 results），
// 故改用 Nominatim。失败时返回 null，由调用方兜底（如 cityName || "北京"）。
export const getCityByCoords = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`,
      {
        headers: {
          "User-Agent": "vitepress-theme-curve/1.0 (blog weather widget; 1req/s)",
        },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    // 优先取 address 中的城市级字段
    const address = data.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state;
    if (city) return city;
    // 回退解析 display_name（形如「区, 市, 省, 国家」），取第一个区段
    if (data.display_name) {
      const first = String(data.display_name).split(",")[0]?.trim();
      return first || null;
    }
    return null;
  } catch (error) {
    console.warn("逆地理编码失败：", error);
    return null;
  }
};
