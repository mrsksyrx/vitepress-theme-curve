<template>
  <a v-if="href" :href="href" class="edit-link" target="_blank" rel="noopener noreferrer">
    <i class="iconfont icon-github" />
    {{ editLink.text || "编辑此页" }}
  </a>
</template>

<script setup>
const { theme, page, frontmatter } = useData();

const editLink = computed(() => theme.value?.editLink || {});

// 加密文不显示编辑入口；未启用或未配置仓库时同样不渲染
const href = computed(() => {
  if (!editLink.value.enable || !editLink.value.repo) return null;
  if (frontmatter.value.password || frontmatter.value.enc) return null;
  const repo = editLink.value.repo.replace(/\/+$/, "");
  const branch = editLink.value.branch || "main";
  // 按路径段编码，保住斜杠；中文/空格文件名也能打开 GitHub 编辑页
  const filePath = (page.value.relativePath || "").split("/").map(encodeURIComponent).join("/");
  if (!filePath) return null;
  return `${repo}/edit/${branch}/${filePath}`;
});
</script>

<style lang="scss" scoped>
.edit-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 8px;
  background-color: var(--main-card-border);
  white-space: nowrap;
  .iconfont {
    margin-right: 6px;
  }
  &:hover {
    color: var(--main-color);
    background-color: var(--main-color-bg);
    .iconfont {
      color: var(--main-color);
    }
  }
}
</style>
