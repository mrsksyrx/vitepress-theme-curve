import { getAllPosts, getAllType } from "../../../../.vitepress/theme/utils/getPostData.mjs";
import { getThemeConfig } from "../../../../.vitepress/init.mjs";

const tagsData = getAllType(await getAllPosts());
const themeConfig = await getThemeConfig();

// 每页文章数（与 page/[num].paths.mjs 同一口径：0 → Infinity 死循环，NaN → 路由消失）
const postsPerPage = Math.max(1, Number(themeConfig.postSize) || 1);

// 标签分页动态路由：第 2 页起生成 /page/N 静态页，第 1 页仍由 [name].paths.mjs 提供
export default {
  paths() {
    const pages = [];
    Object.entries(tagsData).forEach(([name, tag]) => {
      const totalPages = Math.ceil(tag.count / postsPerPage);
      for (let pageNum = 2; pageNum <= totalPages; pageNum += 1) {
        pages.push({ params: { name, num: pageNum.toString() } });
      }
    });
    console.info("标签分页动态路由：", pages);
    return pages;
  },
};
