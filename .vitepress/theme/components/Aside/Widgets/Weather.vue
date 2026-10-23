<!-- 侧边栏 - 天气数据 -->
<template>
  <div class="weather-data s-card">
    <div class="title">
      <i class="iconfont icon-chart"></i>
      <span class="title-name">天气数据</span>
    </div>

    <div class="all-data">
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
import { getAdcode, getWeather, getWeatherWttr, getWeatherOpenMeteo, getCityByCoords } from "@/api";
import { useIsMobileLayout } from "@/utils/layout.js";
import { mainStore } from "@/store";

const isMobileLayout = useIsMobileLayout();
const store = mainStore();

// 声明会在请求出错时抛出的事件
const emit = defineEmits(["fetch-error"]);

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

// 根据定位方式获取城市信息 { city, lat, lon }
const getCityInfo = async () => {
  const mode = store.weatherLocationMode;

  if (mode === "manual") {
    return { city: store.weatherManualCity || "北京", lat: null, lon: null };
  }

  if (mode === "satellite") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ city: "北京", lat: null, lon: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ city: null, lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          resolve(null); // 回退到 IP
        },
        { timeout: 5000 },
      );
    }).then(async (result) => {
      if (result === null) {
        const { city } = await getAdcode(import.meta.env.VITE_WEATHER_KEY);
        return { city: city || "北京", lat: null, lon: null };
      }
      // 卫星定位成功，尝试获取城市名
      if (result.lat != null) {
        try {
          const cityName = await getCityByCoords(result.lat, result.lon);
          return { city: cityName || "北京", lat: result.lat, lon: result.lon };
        } catch {
          return { city: "北京", lat: result.lat, lon: result.lon };
        }
      }
      return result;
    });
  }

  // 默认 IP 定位
  const { city } = await getAdcode(import.meta.env.VITE_WEATHER_KEY);
  return { city: city || "北京", lat: null, lon: null };
};

// 中文城市名转英文
const toEnglishCity = (name) => AMAP_CITY_MAP[name] || name;

// 获取天气数据的核心逻辑
const fetchWeather = async (showMsg = false) => {
  loading.value = true;
  error.value = false;
  try {
    const { city, lat, lon } = await getCityInfo();
    const provider = store.weatherProvider;

    if (provider === "openmeteo") {
      // Open-Meteo：优先使用坐标，没有坐标时通过城市名查询
      let queryLat = lat;
      let queryLon = lon;
      if (queryLat == null) {
        // 用 geocoding API 将城市名转坐标
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
        );
        const geoData = await geoRes.json();
        queryLat = geoData?.results?.[0]?.latitude;
        queryLon = geoData?.results?.[0]?.longitude;
      }
      if (queryLat != null && queryLon != null) {
        const data = await getWeatherOpenMeteo(queryLat, queryLon);
        const c = data?.current;
        if (c) {
          weatherData.value = {
            city: city,
            temperature: c.temperature_2m,
            humidity: c.relative_humidity_2m,
            winddirection: c.wind_direction_10m + "°",
            windpower: c.wind_speed_10m + " km/h",
          };
        }
      }
    } else if (provider === "wttr") {
      // wttr.in
      const englishCity = toEnglishCity(city);
      const data = await getWeatherWttr(englishCity);
      const current = data?.current_condition?.[0];
      if (current) {
        weatherData.value = {
          city: data?.nearest_area?.[0]?.areaName?.[0]?.value || city,
          temperature: current.temp_C,
          humidity: current.humidity,
          winddirection: current.winddir16Point,
          windpower: current.windspeedKmph + " km/h",
        };
      }
    } else {
      // 高德 API，超时或失败时回退到 wttr.in
      try {
        const queryCity =
          store.weatherLocationMode === "manual"
            ? city
            : (
                await Promise.race([
                  getAdcode(import.meta.env.VITE_WEATHER_KEY),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
                ])
              ).adcode;
        const { lives } = await Promise.race([
          getWeather(import.meta.env.VITE_WEATHER_KEY, queryCity),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]);
        weatherData.value = lives?.[0];
      } catch {
        // 高德超时或失败，回退 wttr.in
        const data = await getWeatherWttr(toEnglishCity(city));
        const current = data?.current_condition?.[0];
        if (current) {
          weatherData.value = {
            city: data?.nearest_area?.[0]?.areaName?.[0]?.value || city,
            temperature: current.temp_C,
            humidity: current.humidity,
            winddirection: current.winddir16Point,
            windpower: current.windspeedKmph + " km/h",
          };
        }
      }
    }
    if (showMsg && typeof $message !== "undefined") {
      $message.success("天气数据已刷新");
    }
  } catch (e) {
    console.error("获取天气失败：", e);
    error.value = true;
    emit("fetch-error", e);
    if (showMsg && typeof $message !== "undefined") {
      $message.error("天气数据刷新失败");
    }
  } finally {
    loading.value = false;
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

// 监听全局刷新事件（设置弹窗可能在组件未挂载时触发）
const onWeatherRefresh = () => fetchWeather(true);
onMounted(() => window.addEventListener("weather-refresh", onWeatherRefresh));
onBeforeUnmount(() => window.removeEventListener("weather-refresh", onWeatherRefresh));

onMounted(async () => {
  // 移动端侧边栏不挂载 Weather；小组件浮层挂载时必须拉数据。
  // 仅在「桌面布局却处于移动端宽度」时跳过，避免隐藏状态下白跑定位。
  if (isMobileLayout.value && !props.forceFetch) {
    loading.value = false;
    return;
  }
  await fetchWeather();
});
</script>

<style lang="scss" scoped>
.weather-data {
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
