<!-- 首页 -->
<template>
  <div class="home">
    <Banner v-if="showHeader" :height="store.bannerType" />
    <div class="home-content">
      <div class="posts-content">
        <!-- 分类总览 -->
        <TypeBar :type="showTags ? 'tags' : 'categories'" />
        <!-- 文章列表 -->
        <PostList :listData="postData" />
        <!-- 分页 -->
        <Pagination
          :total="allListTotal"
          :page="Number(page)"
          :limit="postSize"
          :useParams="showCategories || showTags ? true : false"
          :routePath="
            showCategories
              ? `/pages/categories/${encodeURIComponent(showCategories)}`
              : showTags
                ? `/pages/tags/${encodeURIComponent(showTags)}`
                : ''
          "
        />
      </div>
      <!-- 侧边栏 -->
      <Aside v-if="isDesktopAsideVisible" />
    </div>
  </div>
</template>

<script>
// [B42] 模块级：组件随路由重挂载，实例级变量会丢，需跨实例记住最近列表页路径
</script>

<script setup>
import { mainStore } from "@/store";
import { useDesktopAside } from "@/utils/useDesktopAside.mjs";
import { usePostData } from "@/utils/usePostData.mjs";
let lastListPath = null;

const route = useRoute();
const { theme } = useData();
const { isDesktopAsideVisible } = useDesktopAside();
const { postData: allPosts, tagsData, categoriesData, loadPostData } = usePostData();

const store = mainStore();

const props = defineProps({
  // 显示首页头部
  showHeader: {
    type: Boolean,
    default: false,
  },
  // 当前页数
  page: {
    type: Number,
    default: 1,
  },
  // 显示分类
  showCategories: {
    type: [null, String],
    default: null,
  },
  // 显示标签
  showTags: {
    type: [null, String],
    default: null,
  },
});

// 每页文章数（钳制下界与 page/[num].paths.mjs 一致：0 会让 totalPages 变 Infinity，NaN 会让分页失效）
const postSize = Math.max(1, Number(theme.value.postSize) || 1);

// 当前页数（分类 / 标签页使用 query 参数控制，需要手动保持响应式）
const currentPage = ref(props.page || 1);

// 列表总数量
const allListTotal = computed(() => {
  const data = props.showCategories
    ? categoriesData.value[props.showCategories]?.articles
    : props.showTags
      ? tagsData.value[props.showTags]?.articles
      : allPosts.value;
  // 返回数量
  return data ? data.length : 0;
});

// 列表总页数（与 Pagination.vue 的 totalPages 口径一致）
const totalPages = computed(() => Math.max(Math.ceil(allListTotal.value / postSize), 1));

// 把页数钳制到合法范围：下界回落 1，上界钳到最后一页。
// 必须与 Pagination.vue 的 checkCurrentPage 保持同一口径，否则会出现
// "页码高亮在末页、列表却是空" 这类两处行为分叉。
//
// ⚠️ 上界只能依据**已加载**的文章索引：索引是挂载后才 fetch 的，未就绪时
// totalPages 恒为 1，此时钳制会把 /page/2 误判为越界 → 用户看到
// "URL 与高亮是第 2 页、列表却是第 1 页"。故未就绪时只做下界校验，
// 待数据到达后由下方 watch(totalPages) 再按真实页数钳制一次。
const clampPage = (page) => {
  if (!Number.isInteger(page) || page < 1) return 1;
  if (allListTotal.value === 0) return page;
  return Math.min(page, totalPages.value);
};

// 获得当前页数
const getCurrentPage = () => {
  if (props.showCategories || props.showTags) {
    if (typeof window === "undefined") return 1;
    const routePath = route.path;
    const search = routePath.includes("?") ? routePath.split("?")[1] : window.location.search;
    const params = new URLSearchParams(search);
    return clampPage(Number(params.get("page")));
  }
  // [B21] 路径分页（/page/N）也从 URL 解析，统一以 URL 为唯一信源，
  // 避免 props.page 未及时变化时列表与 Pagination 高亮分叉
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/\/page\/(\d+)\/?$/);
    if (match) return clampPage(Number(match[1]));
  }
  return clampPage(props.page || 1);
};

// 更新当前页数
const updateCurrentPage = () => {
  currentPage.value = getCurrentPage();
};

// 根据页数计算列表数据
const postData = computed(() => {
  const page = currentPage.value - 1;
  let data = null;
  // 分类数据
  if (props.showCategories) {
    data = categoriesData.value[props.showCategories]?.articles;
  }
  // 标签数据
  else if (props.showTags) {
    data = tagsData.value[props.showTags]?.articles;
  }
  // 文章数据
  else {
    data = allPosts.value;
  }
  // 返回列表
  return data ? data.slice(page * postSize, page * postSize + postSize) : [];
});

onMounted(() => {
  // [B42] 非「返回同一列表」时清掉残留 lastScrollY，避免跨页被拽到旧位置
  if (store.lastScrollY && lastListPath && lastListPath !== route.path) {
    store.lastScrollY = 0;
  }
  lastListPath = route.path;
  updateCurrentPage();
  loadPostData();
  window.addEventListener("popstate", updateCurrentPage);
  window.addEventListener("pagination-change", updateCurrentPage);
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", updateCurrentPage);
  window.removeEventListener("pagination-change", updateCurrentPage);
});

// 恢复滚动位置
const restoreScrollY = (val) => {
  if (typeof window === "undefined" || val) return false;
  const scrollY = store.lastScrollY;
  // [B42] 无记录时不做无谓 scrollTo（避免与 hash 补滚动竞态）
  if (!scrollY) return false;
  // [B42] 仅当回到保存滚动位置的同一列表页时才恢复
  if (lastListPath && lastListPath !== route.path) {
    store.lastScrollY = 0;
    return false;
  }
  nextTick().then(() => {
    // 平滑滚动
    window.scrollTo({
      top: scrollY,
      behavior: "smooth",
    });
    // 清除滚动位置
    store.lastScrollY = 0;
  });
};

// 监听加载结束
watch(
  () => route.path,
  () => updateCurrentPage(),
);

watch(
  () => props.page,
  () => updateCurrentPage(),
);

// 文章索引加载完成后重算一次页数。
// 冷启动（刷新 / 直接输入 URL）时索引尚未就绪，clampPage 只做了下界校验；
// 数据到达后 totalPages 才有真实值，此时才对越界页码做上界钳制（?page=99 → 末页）。
watch(totalPages, () => updateCurrentPage());

watch(
  () => store.loadingStatus,
  (val) => restoreScrollY(val),
);
</script>

<style lang="scss" scoped>
.home {
  .home-content {
    width: 100%;
    display: flex;
    flex-direction: row;
    .posts-content {
      width: calc(100% - 300px);
      transition: width 0.3s;
    }
    .main-aside {
      width: 300px;
      padding-left: 1rem;
    }
    @media (max-width: 768px) {
      .posts-content {
        width: 100%;
      }
      .main-aside {
        display: none;
      }
    }
  }
}
</style>
