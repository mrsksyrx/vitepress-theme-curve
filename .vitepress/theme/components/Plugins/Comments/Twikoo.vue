<template>
  <div :class="['twikoo-comment', { fill }]">
    <div v-if="status === 'loading'" class="comment-status" role="status">评论区加载中...</div>
    <div v-else-if="status === 'error'" class="comment-status error" role="alert">
      <span>评论区加载失败</span>
      <button type="button" @click="retryComments">重新加载</button>
    </div>
    <div
      v-show="status !== 'error'"
      ref="commentRef"
      id="comment-dom"
      :class="['comment-content', 'twikoo', { fill }]"
    />
  </div>
</template>

<script setup>
import initComments from "@/utils/initComments";

const props = defineProps({
  // 填充评论区
  fill: {
    type: [Boolean, String],
    default: false,
  },
});

const { theme } = useData();
const { comment } = theme.value;

// 评论数据
const twikoo = ref(null);
const commentRef = ref(null);
const status = ref("loading");
// initTwikoo 的 await 期间组件可能已卸载，置位以中止 init（Twikoo 无 destroy API，只能避免泄漏）
let unmounted = false;

// 初始化 Twikoo
const initTwikoo = async () => {
  status.value = "loading";
  try {
    await nextTick();
    const Twikoo = await initComments(theme.value);
    if (unmounted) return;
    const target = commentRef.value;
    if (!target) throw new Error("评论容器不存在");
    target.replaceChildren();
    const instance = await Twikoo.init({
      el: target,
      envId: comment.twikoo.envId,
      onCommentLoaded: () => {
        if (props.fill) fillComments(props.fill);
      },
    });
    if (unmounted) return;
    twikoo.value = instance;
    status.value = "ready";
    return twikoo.value;
  } catch (error) {
    if (unmounted) return;
    console.error("初始化评论出错：", error);
    status.value = "error";
  }
};

const retryComments = () => {
  initTwikoo();
};

// 填充评论区
const fillComments = (data) => {
  // 获取评论元素
  const commentDom = document.querySelector(".tk-input.el-textarea");
  if (!commentDom) return false;
  // 获取输入框
  const commentInput = commentDom.querySelector("textarea");
  if (!commentInput) return false;
  // 写入内容
  commentInput.value = data + "\n\n";
  commentInput.focus();
};

onMounted(() => {
  initTwikoo();
});

onUnmounted(() => {
  unmounted = true;
});
</script>

<style>
.el-textarea__inner {
  font-family: var(--main-font-family);
}
</style>

<style lang="scss" scoped>
.twikoo-comment {
  width: 100%;
  .comment-status {
    display: flex;
    min-height: 120px;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--main-font-second-color);
    font-size: 14px;
    &.error {
      color: var(--main-font-color);
    }
    button {
      padding: 6px 14px;
      border: 1px solid var(--main-card-border);
      border-radius: 8px;
      color: var(--main-color);
      background-color: var(--main-card-background);
      cursor: pointer;
      transition:
        opacity 0.3s,
        transform var(--press-out) var(--press-ease);
      &:hover {
        opacity: 0.8;
      }
      &:active {
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
  }
}
</style>
