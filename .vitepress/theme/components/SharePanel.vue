<!-- 分享面板 -->
<template>
  <Modal
    :show="show"
    title="分享此页"
    titleIcon="link"
    :maxWidth="380"
    elevated
    @mask-click="show = false"
    @modal-close="show = false"
  >
    <div class="share-card">
      <div class="share-grid">
        <div class="share-item" @click="openShare('twitter')">
          <i class="iconfont icon-twitter-x" />
          <span class="name">X</span>
        </div>
        <div class="share-item" @click="openShare('qq')">
          <i class="iconfont icon-qq" />
          <span class="name">QQ</span>
        </div>
        <div class="share-item" @click="openShare('telegram')">
          <i class="iconfont icon-telegram" />
          <span class="name">Telegram</span>
        </div>
        <div class="share-item" :class="{ active: qrVisible }" @click="toggleQr">
          <i class="iconfont icon-image-copy" />
          <span class="name">二维码</span>
        </div>
      </div>
      <div class="share-copy" @click="copyLink">
        <i class="iconfont icon-copy" />
        <span class="name">复制链接</span>
      </div>
      <Transition name="fade-up">
        <div v-if="qrVisible" class="share-qr">
          <Transition name="fade" mode="out-in">
            <div v-if="qrLoading" key="loading" class="qr-loading">生成中...</div>
            <div v-else-if="qrSvg" key="qr" class="qr-svg" v-html="qrSvg" />
          </Transition>
        </div>
      </Transition>
    </div>
  </Modal>
</template>

<script setup>
import { copyText } from "@/utils/helper.mjs";

const { theme, page } = useData();
const router = useRouter();

const show = ref(false);
const titleOverride = ref("");
const qrVisible = ref(false);
const qrSvg = ref("");
const qrLoading = ref(false);
const qrUrlCache = ref("");

// 分享链接：与右键菜单「复制本页地址」一致
const shareUrl = computed(
  () => (theme.value?.siteMeta?.site || "").replace(/\/+$/, "") + router.route.path,
);
const shareTitle = computed(
  () => titleOverride.value || page.value?.frontmatter?.title || page.value?.title || "",
);

// 打开面板（供 window.$share 调用）
// 无参调用（右键「分享本页」）必须清空 override，否则 SPA 切篇后仍分享旧标题
const open = (title) => {
  titleOverride.value = title || "";
  show.value = true;
};

defineExpose({ open });

onMounted(() => {
  window.$share = { open };
});

onUnmounted(() => {
  if (window.$share?.open === open) delete window.$share;
});

// 社交平台跳转：window.open 绕过 jumpRedirect 中转
const openShare = (kind) => {
  const u = encodeURIComponent(shareUrl.value);
  const t = encodeURIComponent(shareTitle.value);
  const urls = {
    twitter: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    qq: `https://connect.qq.com/widget/shareqq/index.html?url=${u}&title=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
  };
  if (urls[kind]) window.open(urls[kind], "_blank", "noopener,noreferrer");
};

const copyLink = () => {
  if (!shareUrl.value) {
    if (typeof $message !== "undefined") {
      $message.error("复制失败：无法获取页面地址");
    }
    return;
  }
  copyText(shareUrl.value);
};

const genQr = async () => {
  if (qrLoading.value) return;
  // 固定本次生成用的 URL：await 期间路由可能已变，完成时不能再读 shareUrl
  const url = shareUrl.value;
  if (qrSvg.value && qrUrlCache.value === url) return;
  qrLoading.value = true;
  try {
    const { toString } = await import("qrcode");
    const svg = await toString(url, { type: "svg", margin: 1, width: 180 });
    // 期间路由已变：丢弃过期结果，由 finally 的补生成逻辑重跑
    if (shareUrl.value !== url) return;
    qrSvg.value = svg;
    qrUrlCache.value = url;
  } catch (error) {
    console.error("二维码生成失败：", error);
    if (typeof $message !== "undefined") {
      $message.error("二维码生成失败");
    }
    qrVisible.value = false;
  } finally {
    qrLoading.value = false;
    // 被丢弃的过期结果会留下空 qrSvg，而面板仍开着 → 为当前 URL 补一次
    if (qrVisible.value && !qrSvg.value) genQr();
  }
};

const toggleQr = () => {
  qrVisible.value = !qrVisible.value;
  if (qrVisible.value) genQr();
};

// 关闭面板时收起并清空二维码（缓存按 URL 校验，清空避免占位）
watch(show, (visible) => {
  if (!visible) {
    qrVisible.value = false;
    qrSvg.value = "";
    qrUrlCache.value = "";
  }
});

// 路由变化时二维码失效：面板开着按前进/后退，shareUrl 变了但面板还开着
watch(shareUrl, () => {
  qrSvg.value = "";
  qrUrlCache.value = "";
  if (qrVisible.value) genQr();
});
</script>

<style lang="scss" scoped>
.share-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.25rem 0;

  .share-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;

    .share-item .name {
      white-space: nowrap;
    }
  }

  .share-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.75rem 0.25rem;
    border-radius: 12px;
    background: var(--main-card-background, rgba(0, 0, 0, 0.03));
    cursor: pointer;
    transition:
      color 0.3s,
      background-color 0.3s,
      transform var(--press-out) var(--press-ease);
    user-select: none;

    .iconfont {
      font-size: 1.4rem;
    }

    .name {
      font-size: 0.78rem;
      opacity: 0.85;
    }

    &:hover,
    &.active {
      color: var(--main-color);
      background-color: var(--main-color-bg);
      .iconfont {
        color: var(--main-color);
      }
    }

    &:active {
      transform: scale(0.94);
      transition-duration: var(--press-in);
    }
  }

  .share-copy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.65rem;
    border-radius: 12px;
    background: var(--main-card-background, rgba(0, 0, 0, 0.03));
    cursor: pointer;
    transition:
      color 0.3s,
      background-color 0.3s,
      transform var(--press-out) var(--press-ease);
    user-select: none;

    .name {
      font-size: 0.85rem;
    }

    &:hover {
      color: var(--main-color);
      background-color: var(--main-color-bg);
      .iconfont {
        color: var(--main-color);
      }
    }

    &:active {
      transform: scale(0.97);
      transition-duration: var(--press-in);
    }
  }

  .share-qr {
    display: flex;
    justify-content: center;
    padding: 0.75rem;

    .qr-loading {
      font-size: 0.85rem;
      opacity: 0.7;
    }

    .qr-svg {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 196px;
      height: 196px;
      padding: 14px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid var(--main-card-border);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      :deep(svg) {
        display: block;
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
