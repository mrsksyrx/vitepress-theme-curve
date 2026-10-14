<!-- 普通页面 -->
<template>
  <div :class="[frontmatter.layout || 'page', { 'has-aside': showAside }]">
    <div class="page-content">
      <!-- 页面内容 -->
      <Content id="page-content" :class="['markdown-main-style', { 's-card': frontmatter.card }]" />
      <!-- 评论 -->
      <Comments v-if="frontmatter.comment" />
    </div>
    <Aside v-if="showAside" />
  </div>
</template>

<script setup>
import { ensureCodeFontLoaded } from "@/utils/fontLoader.mjs";
import { useDesktopAside } from "@/utils/useDesktopAside.mjs";

const { frontmatter, page } = useData();
const { isDesktopAsideVisible } = useDesktopAside();

const showAside = computed(() => frontmatter.value.aside && isDesktopAsideVisible.value);

const loadCodeFontIfNeeded = async () => {
  await nextTick();
  if (document.querySelector('.markdown-main-style div[class*="language-"]')) {
    ensureCodeFontLoaded();
  }
};

onMounted(() => {
  loadCodeFontIfNeeded();
});

// SPA 复用实例时 onMounted 不再触发，切页面需重检代码字体
watch(
  () => page.value.relativePath,
  () => {
    loadCodeFontIfNeeded();
  },
);
</script>

<style lang="scss" scoped>
@use "../style/post.scss";

.page {
  width: 100%;
  display: flex;
  flex-direction: row;
  animation: fade-up 0.6s 0.1s backwards;
  .page-content {
    width: 100%;
    transition: width 0.3s;
    :deep(#main-comment) {
      width: 100%;
      .comment-content {
        .atk-list {
          .atk-list-header {
            margin-bottom: 8px;
          }
          .atk-list-comments-wrap {
            > .atk-comment-wrap {
              padding: 0.8rem;
              margin-bottom: 1rem;
              border-bottom: none;
              border-radius: 16px;
              background-color: var(--main-card-background);
              border: 1px solid var(--main-card-border);
              box-shadow: 0 8px 16px -4px var(--main-border-shadow);
            }
          }
        }
      }
    }
    .s-card {
      padding: 1rem 2rem;
    }
  }
  &.has-aside {
    animation: fade-up 0.6s 0.3s backwards;
    .page-content {
      width: calc(100% - 300px);
    }
    .main-aside {
      width: 300px;
      padding-left: 1rem;
    }
  }
  @media (max-width: 768px) {
    .page-content {
      width: 100% !important;
    }
    .main-aside {
      display: none;
    }
  }
}
</style>
