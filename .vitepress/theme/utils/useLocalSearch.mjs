import MiniSearch from "minisearch";
import { ref } from "vue";
import { useData } from "vitepress";

// CJK bigram + 拉丁/数字整词：默认 tokenizer 会把整句中文当成一个 token
const tokenize = (text) =>
  (String(text).match(/[\u4e00-\u9fff]+|[a-zA-Z0-9_]+/g) || []).flatMap((seg) => {
    if (!/^[\u4e00-\u9fff]+$/.test(seg)) return [seg.toLowerCase()];
    if (seg.length === 1) return [seg];
    return Array.from({ length: seg.length - 1 }, (_, i) => seg.slice(i, i + 2));
  });

let miniSearch = null;
let loadPromise = null;
let loaded = false;

/**
 * 本地全文搜索：fetch 构建期生成的 localSearch.json 并建立 MiniSearch 单例。
 * 与 usePostData 同款 loadPromise 去重；SW precache 保证离线可取。
 */
export const useLocalSearch = () => {
  const { site } = useData();
  const loading = ref(false);
  const loadFailed = ref(false);

  const loadIndex = async () => {
    if (loaded) return miniSearch;
    if (loadPromise) return loadPromise;
    loading.value = true;
    loadFailed.value = false;
    const base = (site.value?.base || "/").replace(/\/$/, "");
    loadPromise = fetch(`${base}/data/localSearch.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`localSearch.json ${res.status}`);
        return res.json();
      })
      .then((data) => {
        miniSearch = new MiniSearch({
          fields: ["title", "headings", "tags", "categories", "description", "content"],
          storeFields: ["url", "title", "headings", "description", "content"],
          idField: "url",
          tokenize,
          searchOptions: {
            boost: { title: 5, tags: 3, headings: 3, categories: 3, description: 2, content: 1 },
            prefix: true,
          },
        });
        miniSearch.addAll(data.posts || []);
        loaded = true;
        return miniSearch;
      })
      .catch((err) => {
        console.warn("[Search] 本地索引加载失败:", err);
        loadFailed.value = true;
        throw err;
      })
      .finally(() => {
        loadPromise = null;
        loading.value = false;
      });
    return loadPromise;
  };

  // query 为空返回 []；加载失败向上抛，由组件展示重试 UI
  const search = async (query) => {
    const q = String(query || "").trim();
    if (!q) return [];
    const ms = await loadIndex();
    return ms.search(q);
  };

  return { loading, loadFailed, loadIndex, search };
};
