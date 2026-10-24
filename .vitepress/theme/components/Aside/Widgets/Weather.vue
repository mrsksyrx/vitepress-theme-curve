<!-- 侧边栏 - 天气数据 -->
<template>
  <div class="weather-data s-card">
    <div class="title">
      <i class="iconfont icon-chart"></i>
      <span class="title-name">天气数据</span>
    </div>

    <div v-if="loading && !weatherData" class="weather-status">正在获取天气数据...</div>
    <div v-else-if="error" class="weather-status weather-error">
      <span>天气数据获取失败</span>
      <button type="button" class="retry-button" @click="fetchWeather(true)">重试</button>
    </div>

    <div v-else class="all-data">
      <!-- 城市 -->
      <div class="data-item">
        <span class="name"><i class="iconfont icon-home"></i> 城市</span>
        <span class="num">{{ weatherData?.city || "--" }}</span>
      </div>
      <!-- 温度 -->
      <div class="data-item">
        <span class="name"><i class="iconfont icon-fire"></i> 温度</span>
        <span class="num">
          {{ weatherData?.temperature != null ? weatherData.temperature + "℃" : "--" }}
        </span>
      </div>
      <!-- 湿度 -->
      <div class="data-item">
        <span class="name"><i class="iconfont icon-visibility"></i> 湿度</span>
        <span class="num">
          {{ weatherData?.humidity != null ? weatherData.humidity + "%" : "--" }}
        </span>
      </div>
      <!-- 风向 -->
      <div class="data-item">
        <span class="name"><i class="iconfont icon-arrow-right"></i> 风向</span>
        <span class="num">{{ weatherData?.winddirection || "--" }}</span>
      </div>
      <!-- 风力 -->
      <div class="data-item">
        <span class="name"><i class="iconfont icon-refresh"></i> 风力</span>
        <span class="num">{{ weatherData?.windpower || "--" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  getAdcode,
  getAdcodeByCoords,
  getCityByCoords,
  getOpenMeteoCoords,
  getWeather,
  getWeatherOpenMeteo,
  getWeatherWttr,
} from "@/api";
import { useIsMobileLayout } from "@/utils/layout.js";
import { mainStore } from "@/store";

const isMobileLayout = useIsMobileLayout();
const store = mainStore();

const props = defineProps({
  // 移动端浮层等场景强制拉取（侧边栏默认移动端不请求）
  forceFetch: {
    type: Boolean,
    default: false,
  },
});

const weatherData = ref(null);
const loading = ref(true);
const error = ref(false);

const AMAP_KEY = import.meta.env.VITE_WEATHER_KEY || "";
const DEFAULT_CITY = "北京";
let fetchId = 0;

// 高德 API 的中文城市名 -> 英文（wttr.in 需要英文城市名）
const AMAP_CITY_MAP = {
  北京: "Beijing",
  上海: "Shanghai",
  广州: "Guangzhou",
  深圳: "Shenzhen",
  杭州: "Hangzhou",
  成都: "Chengdu",
  武汉: "Wuhan",
  南京: "Nanjing",
  重庆: "Chongqing",
  西安: "Xi'an",
  苏州: "Suzhou",
  天津: "Tianjin",
  郑州: "Zhengzhou",
  长沙: "Changsha",
  东莞: "Dongguan",
  沈阳: "Shenyang",
  青岛: "Qingdao",
  合肥: "Hefei",
  佛山: "Foshan",
  宁波: "Ningbo",
  昆明: "Kunming",
  大连: "Dalian",
  厦门: "Xiamen",
  哈尔滨: "Harbin",
  济南: "Jinan",
  福州: "Fuzhou",
  无锡: "Wuxi",
  长春: "Changchun",
  石家庄: "Shijiazhuang",
  常州: "Changzhou",
  南宁: "Nanning",
  贵阳: "Guiyang",
  南昌: "Nanchang",
  太原: "Taiyuan",
  乌鲁木齐: "Urumqi",
  兰州: "Lanzhou",
  海口: "Haikou",
  呼和浩特: "Hohhot",
  银川: "Yinchuan",
  西宁: "Xining",
  拉萨: "Lhasa",
  香港: "Hong Kong",
  澳门: "Macao",
  台北: "Taipei",
};

const withTimeout = (promise, timeout = 8000) => {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("天气请求超时")), timeout);
    }),
  ]).finally(() => clearTimeout(timer));
};

const getPosition = () =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 600000 },
    );
  });

// IP 定位只依赖高德；失败时返回 null，让数据源继续使用自己的兜底能力
const getIpLocation = async () => {
  if (!AMAP_KEY) return null;
  try {
    const data = await withTimeout(getAdcode(AMAP_KEY));
    if (!data?.adcode && !data?.city) return null;
    return {
      city: data.city || null,
      adcode: data.adcode || null,
      lat: null,
      lon: null,
    };
  } catch {
    return null;
  }
};

// 根据定位方式获取城市信息；定位失败不直接终止天气请求
const getCityInfo = async () => {
  const mode = store.weatherLocationMode;

  if (mode === "manual") {
    return {
      city: store.weatherManualCity?.trim() || DEFAULT_CITY,
      adcode: null,
      lat: null,
      lon: null,
    };
  }

  if (mode === "satellite") {
    const position = await getPosition();
    if (position) {
      return { city: null, adcode: null, ...position };
    }
  }

  const ipLocation = await getIpLocation();
  return (
    ipLocation || {
      city: store.weatherProvider === "amap" ? null : DEFAULT_CITY,
      adcode: null,
      lat: null,
      lon: null,
    }
  );
};

const toEnglishCity = (name) => {
  const normalized = String(name || "").replace(/(市|特别行政区)$/u, "");
  return AMAP_CITY_MAP[name] || AMAP_CITY_MAP[normalized] || name || "";
};

const fetchWttr = async (location) => {
  const query =
    location.lat != null && location.lon != null
      ? `~${location.lat},${location.lon}`
      : toEnglishCity(location.city);
  const data = await withTimeout(getWeatherWttr(query));
  const current = data?.current_condition?.[0];
  if (!current) throw new Error("wttr.in 返回数据为空");
  const nearestCity = data?.nearest_area?.[0]?.areaName?.[0]?.value;
  return {
    city: nearestCity || location.city || DEFAULT_CITY,
    temperature: current.temp_C,
    humidity: current.humidity,
    winddirection: current.winddir16Point,
    windpower: current.windspeedKmph + " km/h",
  };
};

const fetchOpenMeteo = async (location) => {
  let coordinates = location;
  let geocodedCity = null;

  if (coordinates.lat == null || coordinates.lon == null) {
    if (!coordinates.city) throw new Error("Open-Meteo 缺少城市或坐标");
    coordinates = await withTimeout(getOpenMeteoCoords(coordinates.city));
    geocodedCity = coordinates.city;
  }

  const data = await withTimeout(getWeatherOpenMeteo(coordinates.lat, coordinates.lon));
  const current = data?.current;
  if (!current) throw new Error("Open-Meteo 返回数据为空");

  let city = location.city || geocodedCity;
  if (!city && location.lat != null && location.lon != null) {
    city = await getCityByCoords(location.lat, location.lon);
  }

  return {
    city: city || DEFAULT_CITY,
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    winddirection: current.wind_direction_10m != null ? current.wind_direction_10m + "°" : "--",
    windpower: current.wind_speed_10m != null ? current.wind_speed_10m + " km/h" : "--",
  };
};

const fetchAmap = async (location) => {
  if (!AMAP_KEY) throw new Error("未配置高德 API Key");

  let queryCity = location.adcode;
  let displayCity = location.city;

  if (location.lat != null && location.lon != null) {
    const regeo = await withTimeout(getAdcodeByCoords(AMAP_KEY, location.lat, location.lon));
    queryCity = regeo.adcode || queryCity;
    displayCity = regeo.city || displayCity;
  }

  queryCity = queryCity || location.city;
  if (!queryCity) throw new Error("无法确定高德天气区域");

  const data = await withTimeout(getWeather(AMAP_KEY, queryCity));
  const current = data?.lives?.[0];
  if (!current) throw new Error("高德天气返回数据为空");

  return {
    ...current,
    city: current.city || displayCity || DEFAULT_CITY,
  };
};

const PROVIDER_CHAINS = {
  amap: ["amap", "wttr", "openmeteo"],
  wttr: ["wttr", "openmeteo"],
  openmeteo: ["openmeteo", "wttr"],
};

const fetchByProvider = (provider, location) => {
  if (provider === "wttr") return fetchWttr(location);
  if (provider === "openmeteo") return fetchOpenMeteo(location);
  return fetchAmap(location);
};

// 获取天气数据的核心逻辑；失败时按数据源链路回退
const fetchWeather = async (showMsg = false) => {
  const currentFetch = ++fetchId;
  loading.value = true;
  error.value = false;

  try {
    const location = await getCityInfo();
    const chain = PROVIDER_CHAINS[store.weatherProvider] || PROVIDER_CHAINS.amap;
    let lastError = null;

    for (let index = 0; index < chain.length; index += 1) {
      const provider = chain[index];
      try {
        const data = await fetchByProvider(provider, location);
        if (currentFetch !== fetchId) return;
        weatherData.value = data;
        if (showMsg && typeof $message !== "undefined") {
          $message.success("天气数据已刷新");
        }
        return;
      } catch (providerError) {
        lastError = providerError;
        console.warn(`天气数据源 ${provider} 获取失败：`, providerError);
      }
    }

    throw lastError || new Error("没有可用的天气数据源");
  } catch (fetchError) {
    if (currentFetch !== fetchId) return;
    console.error("获取天气失败：", fetchError);
    error.value = true;
    if (showMsg && typeof $message !== "undefined") {
      $message.error("天气数据刷新失败");
    }
  } finally {
    if (currentFetch === fetchId) loading.value = false;
  }
};

// 监听天气配置变化，立即刷新
watch(
  () => store.weatherProvider,
  () => fetchWeather(true),
);
watch(
  () => store.weatherLocationMode,
  (mode) => {
    if (mode !== "manual") fetchWeather(true);
  },
);
watch(
  () => store.weatherRefreshTrigger,
  () => fetchWeather(true),
);

onMounted(async () => {
  // 移动端侧边栏不挂载 Weather；小组件浮层挂载时必须拉数据。
  // 仅在「桌面布局却处于移动端宽度」时跳过，避免隐藏状态下白跑定位。
  if (isMobileLayout.value && !props.forceFetch) {
    loading.value = false;
    return;
  }
  await fetchWeather();
});

onBeforeUnmount(() => {
  fetchId += 1;
});
</script>

<style lang="scss" scoped>
.weather-data {
  .weather-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 0;
    color: var(--main-font-second-color);
    font-size: 0.9375rem;

    &.weather-error {
      color: var(--main-red, #e05a5a);
    }

    .retry-button {
      padding: 3px 10px;
      border: 1px solid var(--main-card-border);
      border-radius: 8px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition:
        background-color 0.3s,
        border-color 0.3s;

      &:hover {
        background-color: var(--main-color-bg);
        border-color: var(--main-color);
      }
    }
  }

  .all-data {
    display: flex;
    flex-direction: column;
    margin-top: 12px;

    .data-item {
      width: 100%;
      padding: 8px 0;
      display: flex;
      justify-content: space-between;

      .name {
        font-weight: 500;
        display: flex;
        align-items: center;
        i {
          margin-right: 4px;
        }
      }

      .num {
        font-size: 1.1em;
      }
    }
  }
}
</style>
