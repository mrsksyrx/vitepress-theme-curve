<template>
  <div v-if="type === 'text'" :class="['banner', bannerType]" id="main-banner">
    <h1 class="title">你好，欢迎来到{{ theme.siteMeta.title }}</h1>
    <div class="subtitle">
      <Transition name="fade" mode="out-in">
        <span :key="displayText" class="text" @click="toggleHitokoto">
          {{ displayText }}
        </span>
      </Transition>
    </div>
    <Transition name="fade" mode="out-in">
      <i v-if="height === 'full'" class="iconfont icon-up" @click="scrollToHome" />
    </Transition>
  </div>
  <div
    v-else-if="type === 'page'"
    :class="['banner-page', 's-card', { image }]"
    :style="{
      backgroundImage: image ? `url(${image})` : null,
    }"
  >
    <div class="top">
      <div class="title">
        <span class="title-small">{{ title }}</span>
        <span class="title-big">{{ desc }}</span>
      </div>
      <div class="top-right">
        <slot name="header-slot" />
      </div>
    </div>
    <slot />
    <div class="footer">
      <div class="footer-left">
        {{ footer }}
      </div>
      <div class="footer-right">
        <slot name="footer-slot" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { getHitokoto } from "@/api";

const store = mainStore();
const { theme } = useData();

const props = defineProps({
  type: { type: String, default: "text" },
  height: { type: String, default: "half" },
  title: { type: String, default: "这里是标题" },
  desc: { type: String, default: "这里是简介" },
  footer: { type: String, default: "" },
  image: { type: String, default: "" },
});

// 存储一言数据和状态
const hitokotoData = ref({ hitokoto: "", from: "", from_who: "" });
const isHitokotoDisplayed = ref(false);
const isManualSloganDisplayed = ref(false);

// 自动轮询相关
const hitokotoInitialTimeout = ref(null);
const manualSloganTimeout = ref(null);
const autoSwitchInterval = ref(null);
const autoSwitchActive = ref(false);

// 是否已经手动点击过一次，停止自动并锁定手动模式
const disableAuto = ref(false);

// 默认标语
const defaultSlogan = theme.value.siteMeta.description;
const manualSlogan = "所以，回去吧，回到我们，所有「奇迹」开始的地方";

// 计算展示的文字：若当前为“一言”状态则显示一言，否则显示默认标语
const displayText = computed(() =>
  isHitokotoDisplayed.value && hitokotoData.value.hitokoto
    ? hitokotoData.value.hitokoto
    : isManualSloganDisplayed.value
      ? manualSlogan
      : defaultSlogan,
);

// 点击处理：
// 每次人工点击都会暂停自动轮播；最后一次点击 3 秒后恢复。
async function toggleHitokoto() {
  const isFirstManualInteraction = !disableAuto.value;

  pauseHitokotoCycle();
  disableAuto.value = true;

  if (isFirstManualInteraction) {
    // 首次人工介入时显示手动标语。
    isHitokotoDisplayed.value = false;
    isManualSloganDisplayed.value = true;
  } else {
    // 后续点击仍可手动获取新一言。
    await fetchAndShowHitokoto();
  }

  manualSloganTimeout.value = setTimeout(resumeHitokotoCycle, 3000);
}

// 真正执行一次请求并显示结果
async function fetchAndShowHitokoto() {
  try {
    const result = await getHitokoto();
    hitokotoData.value = {
      hitokoto: result.hitokoto,
      from: result.from,
      from_who: result.from_who,
    };
    isHitokotoDisplayed.value = true;
    isManualSloganDisplayed.value = false;
  } catch (err) {
    console.error("一言获取失败：", err);
  }
}

// 自动轮询执行
async function autoToggleHitokoto() {
  await fetchAndShowHitokoto();
}

// 启动首次延迟 + 后续自动轮询
function startHitokotoCycle() {
  if (disableAuto.value) return;
  hitokotoInitialTimeout.value = setTimeout(async () => {
    await fetchAndShowHitokoto();
    autoSwitchInterval.value = setInterval(autoToggleHitokoto, 7000);
    autoSwitchActive.value = true;
  }, 4000);
}

// 手动标语停留 3 秒后，恢复正常的一言轮播。
async function resumeHitokotoCycle() {
  manualSloganTimeout.value = null;
  disableAuto.value = false;
  await fetchAndShowHitokoto();
  if (!disableAuto.value && !autoSwitchInterval.value) {
    autoSwitchInterval.value = setInterval(autoToggleHitokoto, 7000);
    autoSwitchActive.value = true;
  }
}

function clearManualSloganTimeout() {
  if (manualSloganTimeout.value) {
    clearTimeout(manualSloganTimeout.value);
    manualSloganTimeout.value = null;
  }
}

// 暂停所有定时/请求
function pauseHitokotoCycle() {
  clearManualSloganTimeout();
  if (hitokotoInitialTimeout.value) {
    clearTimeout(hitokotoInitialTimeout.value);
    hitokotoInitialTimeout.value = null;
  }
  if (autoSwitchInterval.value) {
    clearInterval(autoSwitchInterval.value);
    autoSwitchInterval.value = null;
  }
  autoSwitchActive.value = false;
}

// Page Visibility API：切换标签页时暂停，切回时（若未手动禁用）恢复
function handleVisibilityChange() {
  if (document.hidden) {
    pauseHitokotoCycle();
  } else if (!disableAuto.value && !autoSwitchActive.value && !hitokotoInitialTimeout.value) {
    startHitokotoCycle();
  }
}

// 滚动至首页
function scrollToHome() {
  const bannerDom = document.getElementById("main-banner");
  if (!bannerDom) return;
  scrollTo({ top: bannerDom.offsetHeight, behavior: "smooth" });
}

// 同步外部 store 的 bannerType
const bannerType = ref(store.bannerType);
watch(
  () => store.bannerType,
  (val) => (bannerType.value = val),
);

onMounted(() => {
  if (props.type === "text") {
    startHitokotoCycle();
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
});

onBeforeUnmount(() => {
  pauseHitokotoCycle();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.banner {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fade-up 0.6s 0.1s backwards;
  transition: height 0.3s;
  &.full {
    opacity: 0;
    height: calc(100vh - 70px);
    padding-bottom: 100px;
    animation: fade-up 0.6s 0.5s forwards;
    .subtitle {
      opacity: 0;
      animation: fade-up-opacity 0.8s 0.5s forwards;
    }
  }
  .title {
    font-family: var(--main-font-family);
    font-weight: bold;
    font-size: 2.75rem;
  }
  .subtitle {
    width: 80%;
    font-size: 1.25rem;
    opacity: 0.8;
    animation: fade-up-opacity 0.6s 0.1s backwards;
    font-family: "xiaolai", var(--main-font-family);
    .text {
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2; // WebKit 引擎兼容性
      -webkit-box-orient: vertical; // WebKit 引擎兼容性

      line-clamp: 2; // 标准的 line-clamp 属性，提高兼容性
      transition: opacity var(--press-out) var(--press-ease);
      // 点击反馈：文本行整体缩放观感较差，使用透明度
      &:active {
        opacity: 0.6;
        transition-duration: var(--press-in);
      }
    }
  }
  .icon-up {
    font-size: 20px;
    position: absolute;
    bottom: 60px;
    left: calc(50% - 10px);
    transform: rotate(180deg);
    animation: moveDown 2s ease-in-out infinite;
    cursor: pointer;
    transition: opacity var(--press-out) var(--press-ease);
    // 点击反馈：已有 rotate 与 moveDown 动画，使用透明度
    &:active {
      opacity: 0.6;
      transition-duration: var(--press-in);
    }
  }
  @media (max-width: 768px) {
    align-items: flex-start;
    height: 240px;
    .title {
      font-size: 2.25rem;
    }
    .subtitle {
      height: 50px;
      font-size: 1.125rem;
      margin-left: 8px;
      .text {
        text-align: left;
      }
    }
  }
}
.banner-page {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  min-height: 380px;
  background-size: cover;
  .top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    .title {
      display: flex;
      flex-direction: column;
      .title-small {
        color: var(--main-font-second-color);
        font-size: 0.875rem;
      }
      .title-big {
        font-size: 2.25rem;
        font-weight: bold;
        line-height: 1.2;
        margin-top: 12px;
      }
    }
  }
  .footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    .footer-left {
      margin-top: auto;
      color: var(--main-font-second-color);
      opacity: 0.8;
    }
  }
  &.image {
    color: #fff !important;
    .top {
      .title-small {
        color: #fff;
        opacity: 0.6;
      }
    }
    .footer {
      .footer-left {
        color: #fff;
      }
      :deep(.iconfont) {
        color: #fff !important;
      }
    }
  }
  @media (max-width: 1200px) {
    min-height: 300px;
  }
  @media (max-width: 768px) {
    min-height: 260px;
    .top-right,
    .footer-right {
      display: none;
    }
  }
}
</style>
