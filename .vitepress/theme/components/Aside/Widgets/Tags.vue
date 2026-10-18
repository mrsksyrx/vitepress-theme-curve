<!-- 侧边栏 - 标签 -->
<template>
  <div class="tags-cloud s-card">
    <div class="title">
      <i class="iconfont icon-hashtag"></i>
      <span class="title-name">标签列表</span>
    </div>
    <!-- expandAll：移动端浮层等场景不限高、无渐变遮罩，全量展示 -->
    <div :class="['all-tags', { expand: expandAll }]">
      <a
        v-for="(item, tag, index) in tagsData"
        :key="index"
        :href="`/pages/tags/${encodeURIComponent(tag)}`"
        class="tags"
      >
        <span class="name">{{ tag }}</span>
        <sup class="num">{{ item.count }}</sup>
      </a>
    </div>
    <a v-if="!expandAll" href="/pages/tags" class="more-tags">查看全部</a>
  </div>
</template>

<script setup>
import { usePostData } from "@/utils/usePostData.mjs";

defineProps({
  // 不折叠：展示全部标签（侧边栏默认限高 + 渐变）
  expandAll: {
    type: Boolean,
    default: false,
  },
});

const { tagsData, loadPostData } = usePostData();

onMounted(() => {
  loadPostData();
});
</script>

<style lang="scss" scoped>
.tags-cloud {
  .all-tags {
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    max-height: 500px;
    overflow: hidden;
    .tags {
      display: inline-block;
      padding: 4px 8px;
      margin: 2px;
      border-radius: 8px;
      .num {
        margin-left: 2px;
        opacity: 0.6;
      }
      &:hover {
        color: var(--main-color);
        background-color: var(--main-color-bg);
      }
      &:active {
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 48%;
      max-height: 150px;
      background-image: linear-gradient(to top, var(--main-card-background), transparent);
      pointer-events: none;
    }
    // 全量展示：去掉限高与底部渐变
    &.expand {
      max-height: none;
      overflow: visible;
      &::after {
        display: none;
      }
    }
  }
  .more-tags {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    border-radius: 8px;
    font-size: 14px;
    border: 1px solid var(--main-card-border);
    background-color: var(--main-card-second-background);
    &:hover {
      color: var(--main-color);
      border-color: var(--main-color-bg);
      background-color: var(--main-color-bg);
    }
    &:active {
      transform: scale(0.98);
      transition-duration: var(--press-in);
    }
  }
}
</style>
