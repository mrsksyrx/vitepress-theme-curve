<template>
  <div ref="commentRef" id="comment-dom" :class="['comment-content', 'twikoo', { fill }]" />
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
// initTwikoo 的 await 期间组件可能已卸载，置位以中止 init（Twikoo 无 destroy API，只能避免泄漏）
let unmounted = false;

// 初始化 Twikoo
const initTwikoo = async () => {
  try {
    await nextTick();
    const Twikoo = await initComments(theme.value);
    if (unmounted) return;
    twikoo.value = Twikoo.init({
      el: commentRef.value || "#comment-dom",
      envId: comment.twikoo.envId,
      onCommentLoaded: () => {
        if (props.fill) fillComments(props.fill);
      },
    });
    return twikoo.value;
  } catch (error) {
    console.error("初始化评论出错：", error);
  }
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
