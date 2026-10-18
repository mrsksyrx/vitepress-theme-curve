<template>
  <!-- 默认移动端不渲染；小组件浮层可传 showOnMobile 强制显示 -->
  <div v-if="showOnMobile || !isMobile" class="site-data s-card">
    <div class="title">
      <i class="iconfont icon-chart"></i>
      <span class="title-name">HelloGithub 热榜</span>
    </div>

    <!-- 列表容器：默认只露出前 5 条；expandAll 时不限高，全量展示 -->
    <div
      class="all-data"
      ref="listContainer"
      :style="!expandAll && containerHeight > 0 ? { maxHeight: containerHeight + 'px' } : null"
    >
      <div class="data-item" v-for="(item, index) in list" :key="item.id">
        <span class="name">{{ index + 1 }}.</span>
        <span class="num">
          <a :href="item.url" target="_blank" rel="noopener noreferrer">
            {{ item.title }}
          </a>
        </span>
      </div>
    </div>

    <!-- 最后更新时间 -->
    <div v-if="formattedUpdateTime" class="update-time">最后更新：{{ formattedUpdateTime }}</div>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { useIsMobileLayout } from "@/utils/layout.js";

const store = mainStore();
const isMobile = useIsMobileLayout();

const props = defineProps({
  // 移动端浮层等场景强制显示并拉取
  showOnMobile: {
    type: Boolean,
    default: false,
  },
  // 不折叠：展示全部条目（侧边栏默认只露前 5 条）
  expandAll: {
    type: Boolean,
    default: false,
  },
});

// 数据与状态
// —— 新增：定义 emit ——
const emit = defineEmits(["fetch-error"]);

const list = ref([]);
const rawUpdateTime = ref("");
const containerHeight = ref(0);
const listContainer = ref(null);
// 从环境变量读取 API 地址
const API_URL = import.meta.env.VITE_HELLOGITHUB_API_URL;

// 将 ISO 时间解析成 'YYYY-MM-DD HH:mm:ss'
const formattedUpdateTime = computed(() => {
  if (!rawUpdateTime.value) return "";
  const d = new Date(rawUpdateTime.value);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
});

async function fetchData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    // 接口通常返回 20 条；expandAll 时全量展示，否则仍由 calcHeight 裁到前 5 条高度
    list.value = data.data || [];
    rawUpdateTime.value = data.updateTime || "";
    if (props.expandAll) return;
    await nextTick();
    calcHeight();
  } catch (e) {
    console.error("HelloGithub 热榜加载失败", e);
    // —— 关键：向父组件抛出错误 ——
    emit("fetch-error", e);
  }
}

// 计算前 5 条总高度（包含 margin）
function calcHeight() {
  const container = listContainer.value;
  if (!container) return;
  const items = Array.from(container.querySelectorAll(".data-item")).slice(0, 5);
  const total = items.reduce((sum, el) => {
    const style = getComputedStyle(el);
    const margin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    return sum + el.getBoundingClientRect().height + margin;
  }, 0);
  containerHeight.value = total;
}

onMounted(() => {
  if ((!props.showOnMobile && isMobile.value) || !API_URL) return;
  fetchData();
  if (!props.expandAll) {
    window.addEventListener("resize", calcHeight);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", calcHeight);
});
</script>

<style lang="scss" scoped>
.site-data {
  margin-bottom: 1rem;
  .iconfont {
    opacity: 0.6;
    margin-right: 6px;
  }
  .title-name {
    opacity: 0.8;
  }
  .title {
    padding: 0.3rem 0.5rem;
    margin-bottom: 5px;
    font-weight: bold;
    display: flex;
    align-items: center;
    opacity: 0.75;
  }
  .all-data {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;

    .data-item {
      display: flex;
      align-items: flex-start;
      padding: 0.2rem 0.1rem;
      line-height: 1.4rem;
      font-size: 14px;

      .name {
        flex-shrink: 0;
        width: 1.2rem;
        text-align: center;
        opacity: 0.8;
        font-weight: bold;
      }
      .num {
        flex: 1;
        margin-left: 0.3rem;
        a {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          white-space: normal;
          opacity: 0.8;
          text-decoration: none;
          // display 为 -webkit-box（非 flex/inline-block 等白名单值），按内联元素处理用透明度
          &:active {
            opacity: 0.6;
            transition-duration: var(--press-in);
          }
        }
      }

      &:last-child {
        padding-bottom: 0;
      }
    }
  }

  /* 更新时间样式 */
  .update-time {
    margin: 0.2rem 0.5rem;
    font-size: 12px;
    color: #888;
    text-align: right;
  }
}
</style>
