<!-- 下一篇文章 -->
<template>
  <div
    v-if="nextPostData"
    :class="[
      'next-post',
      's-card',
      {
        fixed: infoPosition === 'fixed',
        show: infoPosition === 'fixed' && nextPostShow && !footerIsShow,
      },
    ]"
    @click="router.go(nextPostData?.regularPath)"
  >
    <span class="post-tip">
      {{ isNextPost ? "下一篇阅读" : "阅读上一篇" }}
    </span>
    <span class="post-title">
      {{ nextPostData?.title || "暂无标题" }}
    </span>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import { usePostData } from "@/utils/usePostData.mjs";

const router = useRouter();
const store = mainStore();
const { page } = useData();
const { postData, loadPostData } = usePostData();
const { footerIsShow, infoPosition } = storeToRefs(store);

// 文章信息
const observer = ref(null);
const isNextPost = ref(true);
const nextPostShow = ref(false);
const nextPostData = ref(null);
// loadPostData 的 then 期间组件可能已卸载，置位以中止写状态 / 创建观察器
let unmounted = false;

// 获取文章
const getNextPostData = () => {
  const { relativePath } = page.value;
  if (!postData.value.length || !relativePath) return false;
  // 本篇索引
  const postId = relativePath;
  const postIndex = postData.value.findIndex((post) => post.id === postId);
  // 是否有下一篇
  if (postIndex >= 0 && postIndex < postData.value.length - 1) {
    nextPostData.value = postData.value[postIndex + 1];
    isNextPost.value = true;
    return true;
  }
  // 是否有上一篇
  else if (postIndex > 0) {
    nextPostData.value = postData.value[postIndex - 1];
    isNextPost.value = false;
    return true;
  }
  // 如果没有任何文章
  nextPostData.value = null;
  return false;
};

// 监听文章视窗
const isShowNext = () => {
  const postDom = document.getElementById("page-content");
  if (!postDom) return false;
  if (observer.value) observer.value?.disconnect();
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      nextPostShow.value = entry.isIntersecting ? false : true;
    });
  });
  // 添加监视器
  observer.value?.observe(postDom);
};

watch(
  () => router.route?.path,
  () => {
    getNextPostData();
    isShowNext();
  },
);

onMounted(() => {
  loadPostData().then(() => {
    if (unmounted) return;
    getNextPostData();
    isShowNext();
  });
});

onBeforeUnmount(() => {
  unmounted = true;
  if (observer.value) observer.value?.disconnect();
});
</script>

<style lang="scss" scoped>
.next-post {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--main-card-background);
  .post-tip {
    font-size: 14px;
    color: var(--main-font-second-color);
    padding-bottom: 8px;
    margin-bottom: 12px;
    border-bottom: 1px dashed var(--main-card-border);
    transition: color 0.3s;
  }
  .post-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  &.fixed {
    position: fixed;
    right: 20px;
    bottom: 20px;
    opacity: 0;
    z-index: 100;
    width: 300px;
    transform: translateY(180px);
  }
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
  &:hover {
    background-color: var(--main-color);
    border-color: var(--main-color);
    color: var(--main-card-background);
    box-shadow: 0 8px 16px -4px var(--main-color-bg);
    .post-tip {
      opacity: 0.8;
      color: var(--main-card-background);
    }
  }
  // .fixed/.show 已用 transform 做位移动画，按下反馈改用透明度
  &:active {
    opacity: 0.6;
    transition-duration: var(--press-in);
  }
  @media (max-width: 768px) {
    display: none;
  }
}
</style>
