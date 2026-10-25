<!-- 全局搜索内容（Modal 壳在 Nav 同步渲染，这里只放重依赖的 Algolia 部分） -->
<template>
  <ais-instant-search
    v-if="hasSearchConfig"
    ref="instantSearchRef"
    :search-client="searchClient"
    :future="{
      preserveSharedStateOnUnmount: true,
    }"
    :index-name="indexName"
    @state-change="searchChange"
  >
    <ais-configure
      :hits-per-page.camel="8"
      :attributes-to-highlight.camel="['title', 'description', 'headers', 'content']"
    />
    <ais-search-box :key="searchBoxKey" placeholder="想要搜点什么" autofocus />
    <ais-hits v-if="hasSearchValue">
      <template v-slot="{ items }">
        <Transition name="fade" mode="out-in">
          <div v-if="formatSearchData(items)?.length" class="search-list">
            <div
              v-for="(item, index) in formatSearchData(items)"
              :key="index"
              class="search-item s-card hover"
              @click="jumpSearch(item.url)"
            >
              <p class="title" v-html="item.title" />
              <p v-if="item?.anchor" class="anchor" v-html="item.anchor" />
              <p v-if="item?.content" class="content s-card" v-html="item.content" />
            </div>
          </div>
          <div v-else class="no-result">
            <i class="iconfont icon-search-empty" />
            <span class="text">搜索结果为空</span>
          </div>
        </Transition>
      </template>
    </ais-hits>
    <ais-pagination v-if="hasSearchValue" />
    <ais-stats>
      <template v-slot="{ processingTimeMS }">
        <div class="information">
          <span v-if="hasSearchValue" class="text"> 本次用时 {{ processingTimeMS }} 毫秒 </span>
        </div>
        <a
          class="power"
          href="https://www.algolia.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="iconfont icon-algolia" />
          <span class="name">Algolia</span>
        </a>
      </template>
    </ais-stats>
  </ais-instant-search>
  <div v-else class="no-config">搜索未配置</div>
</template>

<script setup>
import { mainStore } from "@/store";
import { liteClient } from "algoliasearch/lite";
// 显式导入，避免依赖 app.use 全局注册（Nav 里注册时机不可靠会导致组件不渲染）
import {
  AisInstantSearch,
  AisConfigure,
  AisSearchBox,
  AisHits,
  AisPagination,
  AisStats,
} from "vue-instantsearch/vue3/es";

const store = mainStore();
const router = useRouter();

const { theme } = useData();
const { appId, apiKey, index } = theme.value.search ?? {};

const hasSearchConfig = Boolean(appId && apiKey);
if (!hasSearchConfig) {
  console.warn("[Search] theme.search 缺少 appId / apiKey，搜索功能不可用");
}
const searchClient = hasSearchConfig ? liteClient(appId, apiKey) : null;
const indexName = index || "example_com_pages";

// 是否具有搜索词
const hasSearchValue = ref(false);

// 关闭弹层时清空搜索词（Modal persistent 常驻，不能靠卸载重置）
// setUiState 清的是 InstantSearch 状态；SearchBox 是非受控输入，需换 key 强制重建
const instantSearchRef = ref(null);
const searchBoxKey = ref(0);
watch(
  () => store.searchShow,
  (open) => {
    if (open) return;
    hasSearchValue.value = false;
    searchBoxKey.value += 1;
    instantSearchRef.value?.instantSearchInstance?.setUiState({ [indexName]: { query: "" } });
  },
);

// 搜索变化
const searchChange = ({ uiState, setUiState }) => {
  const searchData = Object.values(uiState);
  hasSearchValue.value = searchData.length > 0 && searchData[0].query?.length > 0;
  setUiState(uiState);
};

// 保留高亮标签并统一为 <mark>（模板样式即按 mark 写），剥除其余标签与属性，避免 v-html 注入
const sanitizeHighlight = (value) => {
  if (typeof value !== "string") return "";
  // 高亮标记有三种来源：InstantSearch 请求标记 __ais-highlight__、
  // 索引默认 <em>、instantsearch hits 插槽转换后的 <mark>，先暂存再统一还原
  return value
    .replace(/__ais-highlight__/g, "\uE000")
    .replace(/__\/ais-highlight__/g, "\uE001")
    .replace(/<em[^>]*>/gi, "\uE000")
    .replace(/<\/em\s*>/gi, "\uE001")
    .replace(/<mark[^>]*>/gi, "\uE000")
    .replace(/<\/mark\s*>/gi, "\uE001")
    .replace(/<[^>]*>/g, "")
    .replace(/\uE000/g, "<mark>")
    .replace(/\uE001/g, "</mark>");
};

// 取首个命中搜索词的标题行，否则退回第一行，作为结果卡片的锚点
const pickHighlightedHeader = (hlHeaders, headers) => {
  if (Array.isArray(hlHeaders)) {
    const matched = hlHeaders.find((h) => h?.matchLevel !== "none" && h?.value);
    if (matched) return matched.value;
    const first = hlHeaders.find((h) => h?.value);
    if (first) return first.value;
  }
  return Array.isArray(headers) && headers.length ? headers[0] : "";
};

// 扁平索引的 content 是整页正文：围绕首个命中词截一段，避免整页塞进结果卡片
const excerptAroundMatch = (raw, max = 160) => {
  const text = sanitizeHighlight(raw);
  if (!text) return "";
  if (text.length <= max) return text;
  const matched = text.indexOf("<mark>");
  const start = matched === -1 ? 0 : Math.max(0, matched - 40);
  // 截取窗口，随后清理可能被切断的半截标签并补齐未闭合的 </mark>
  let slice = text.slice(start, start + max);
  const lastLt = slice.lastIndexOf("<");
  if (lastLt !== -1 && slice.indexOf(">", lastLt) === -1) slice = slice.slice(0, lastLt);
  if (slice.startsWith("</mark>")) slice = slice.slice(7);
  const opens = slice.split("<mark>").length - 1;
  const closes = slice.split("</mark>").length - 1;
  if (opens > closes) slice += "</mark>";
  return `${start > 0 ? "…" : ""}${slice}${start + max < text.length ? "…" : ""}`;
};

// 处理搜索结果
const formatSearchData = (data) => {
  const results = [];
  // 遍历搜索结果
  for (let i = 0; i < data.length; i++) {
    const search = data[i];
    const url = search?.url;
    const hl = search?._highlightResult ?? {};
    // DocSearch 层级结构（上游默认索引）
    if (hl.hierarchy) {
      const type = search.type === "lvl1" ? "post" : "content";
      const title = sanitizeHighlight(hl.hierarchy.lvl1?.value);
      const anchor = sanitizeHighlight(hl.hierarchy[search.type]?.value);
      const content = sanitizeHighlight(hl.content?.value);
      results.push({ url, type, title, anchor, content });
      continue;
    }
    // 扁平结构（Algolia Crawler 抓取的索引：title / headers / content）
    const title = sanitizeHighlight(hl.title?.value ?? search.title ?? "");
    const anchor = sanitizeHighlight(pickHighlightedHeader(hl.headers, search.headers));
    const contentSan = sanitizeHighlight(hl.content?.value);
    const content = contentSan.includes("<mark>")
      ? excerptAroundMatch(contentSan)
      : sanitizeHighlight(hl.description?.value) || contentSan;
    results.push({ url, type: "post", title, anchor, content });
  }
  return results;
};

// 跳转搜索结果
const jumpSearch = (url) => {
  store.changeShowStatus("searchShow");
  router.go(url);
};

onBeforeUnmount(() => {
  hasSearchValue.value = false;
});
</script>

<style lang="scss">
.ais-InstantSearch {
  height: 100%;
  .ais-SearchBox {
    height: 40px;
    width: 100%;
    .ais-SearchBox-input {
      width: 100%;
      outline: none;
      border-radius: 8px;
      font-size: 16px;
      padding: 0.6rem 1rem;
      color: var(--main-font-color);
      font-family: var(--main-font-family);
      border: 1px solid var(--main-card-border);
      background-color: var(--main-card-second-background);
      transition:
        border-color 0.3s,
        box-shadow 0.3s;
      &:focus {
        border-color: var(--main-color);
        box-shadow: 0 8px 16px -4px var(--main-color-bg);
      }
      &::-webkit-search-cancel-button {
        display: none;
      }
    }
    .ais-SearchBox-loadingIndicator,
    .ais-SearchBox-submit,
    .ais-SearchBox-reset {
      display: none;
    }
  }
  .ais-Hits {
    margin-top: 20px;
    min-height: 300px;
    height: 100%;
    .no-result {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .iconfont {
        font-size: 40px;
        margin-bottom: 12px;
      }
      .text {
        font-size: 18px;
        opacity: 0.6;
      }
    }
    .search-list {
      .search-item {
        margin-bottom: 12px;
        &:active {
          transform: scale(0.98);
          transition-duration: var(--press-in);
        }
        .title {
          display: inline;
          font-size: 16px;
          margin-bottom: 6px;
        }
        .anchor {
          margin-top: 6px;
          color: var(--main-font-second-color);
          font-size: 14px;
          &::before {
            content: "# ";
          }
        }
        .content {
          color: var(--main-font-second-color);
          margin-top: 0.8rem;
          font-size: 12px;
          padding: 8px;
          border-radius: 8px;
          // 扁平索引的 content 是整页正文，限三行避免撑爆结果卡片
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        p {
          margin: 0;
          mark {
            background-color: transparent;
            color: var(--main-color);
          }
        }
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
  .ais-Pagination {
    margin-top: 20px;
    .ais-Pagination-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      .ais-Pagination-item {
        margin: 0 4px;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        transition: background-color 0.3s;
        cursor: pointer;
        .ais-Pagination-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          &:hover {
            color: var(--main-font-color);
          }
        }
        &:hover {
          color: var(--main-font-color);
          background-color: var(--main-color);
          .ais-Pagination-link {
            color: var(--main-card-border);
          }
        }
        &.ais-Pagination-item--selected {
          font-weight: bold;
          background-color: var(--main-color);
          .ais-Pagination-link {
            color: var(--main-card-border);
          }
        }
        &.ais-Pagination-item--disabled,
        &.ais-Pagination-item--nextPage,
        &.ais-Pagination-item--lastPage {
          opacity: 0.8;
        }
      }
    }
  }
  .ais-Stats {
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 20px;
    opacity: 0.8;
    font-size: 14px;
    .power {
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 16px;
      opacity: 0.6;
      transition:
        color 0.3s,
        opacity 0.3s;
      .iconfont {
        margin-right: 4px;
        font-size: 20px;
        transition: color 0.3s;
      }
      .name {
        font-weight: bold;
      }
      &:hover {
        opacity: 1;
        color: var(--main-color);
        .iconfont {
          color: var(--main-color);
        }
      }
      &:active {
        opacity: 1;
        transition-duration: var(--press-in);
      }
    }
    @media (max-width: 512px) {
      justify-content: center;
      .information {
        display: none;
      }
    }
  }
}
.no-config {
  padding: 24px 0;
  text-align: center;
  color: var(--main-font-second-color);
  opacity: 0.7;
}
</style>
