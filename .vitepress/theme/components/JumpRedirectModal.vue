<!-- 外链中转：安全中心弹窗 -->
<!--
  普通左键点击外链时弹出；public/redirect.html 仍是无 JS、中键打开时的整页兜底。
  白/黑名单与 redirect.html 内联脚本重复（该页是独立静态文件无法共享模块），改动需双向同步。
-->
<template>
  <Modal
    :show="show"
    title="安全中心"
    titleIcon="safe"
    :maxWidth="440"
    elevated
    @mask-click="close"
    @modal-close="close"
  >
    <div class="jump-card">
      <span class="jump-tip">您即将离开{{ siteName }}，前往</span>
      <div class="jump-url">{{ targetUrl }}</div>
      <div class="jump-status" :class="status">{{ statusText }}</div>
      <div class="jump-actions">
        <span class="jump-btn ghost" @click="close">取消</span>
        <span class="jump-btn primary" :class="{ disabled: status === 'danger' }" @click="onAction">
          {{ actionText }}
        </span>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { shouldSkipRedirect } from "@/utils/commonTools.mjs";

const { theme } = useData();

const show = ref(false);
const targetUrl = ref("");
// safe：白名单（倒计时自动跳转）；warn：未知（手动确认）；danger：黑名单（禁止跳转）
const status = ref("warn");
const countdown = ref(0);
// 倒计时自动跳转被弹窗拦截时置真，提示改为手动点击
const blocked = ref(false);
let timer = null;

// 与 public/redirect.html 保持一致（该页无法 import 主题模块，改动需双向同步）
const whitelist = [
  "*.sgexilq.com",
  "*.sgexilq.top",
  "*.20091010.xyz",
  "*.mrsksyrx.top",
  "gitee.com",
  "github.com",
  "*.baidu.com",
  "*.bing.cn",
  "npmjs.com",
];
const blacklist = ["*.taobao.com", "*.jd.com"];
// 精确主机匹配：*.foo.com 仅匹配 foo.com 与其直接子域，避免正则子串绕过
const matches = (host, rule) =>
  rule.startsWith("*.")
    ? host === rule.slice(2) || host.endsWith("." + rule.slice(2))
    : host === rule;

const siteName = computed(() => theme.value?.siteMeta?.title || "本站");

const statusText = computed(() => {
  if (status.value === "danger") return "⛔ 该网址处于黑名单";
  if (status.value === "safe") {
    return blocked.value
      ? "⚠️ 自动跳转被浏览器拦截，请点击下方按钮"
      : "✅ 该网址为信任网址，即将跳转";
  }
  return "⚠️ 该网址安全性未知，请注意您的帐号和财产安全";
});

const actionText = computed(() => {
  if (status.value === "danger") return "禁止跳转";
  if (status.value === "safe" && countdown.value > 0) return `${countdown.value} 秒后自动跳转`;
  return "继续前往";
});

const stopCountdown = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  countdown.value = 0;
};

const close = () => {
  stopCountdown();
  show.value = false;
};

// 目标页在新标签打开（保持原 target="_blank" 语义），opener 置空防反向劫持
const doJump = () => {
  if (status.value === "danger" || !targetUrl.value) return;
  const win = window.open(targetUrl.value, "_blank");
  if (win) {
    win.opener = null;
    close();
  } else {
    // 倒计时自动跳转可能被弹窗拦截：保留弹窗，改由用户点击（用户手势内必定放行）
    blocked.value = true;
    stopCountdown();
  }
};

const startCountdown = () => {
  stopCountdown();
  blocked.value = false;
  countdown.value = 3;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      stopCountdown();
      doJump();
    }
  }, 1000);
};

const onAction = () => {
  if (status.value === "danger") return;
  stopCountdown();
  doJump();
};

const classify = (hostname) => {
  if (blacklist.some((rule) => matches(hostname, rule))) return "danger";
  if (whitelist.some((rule) => matches(hostname, rule))) return "safe";
  return "warn";
};

/**
 * 打开安全中心弹窗
 * @param {string} url 目标地址
 * @param {Element} [sourceEl] 来源链接（用于排除类名校验）
 * @returns {boolean} 是否由弹窗接管（false 时调用方应回退直接打开）
 */
const open = (url, sourceEl) => {
  if (!theme.value?.jumpRedirect?.enable || !url) return false;
  const exclude = theme.value?.jumpRedirect?.exclude || [];
  if (sourceEl && exclude.some((className) => sourceEl.classList.contains(className))) {
    return false;
  }
  // 同源 / 非 http(s) / 始终排除域名一律不接管
  if (shouldSkipRedirect(url)) return false;
  let parsed;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return false;
  }
  targetUrl.value = parsed.href;
  status.value = classify(parsed.hostname);
  blocked.value = false;
  show.value = true;
  if (status.value === "safe") startCountdown();
  else stopCountdown();
  return true;
};

// 文档级捕获监听：早于组件内 @click.stop，拦截左键点击外链的默认新标签行为
const onDocClick = (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  const el = event.target;
  if (!(el instanceof Element)) return;
  const anchor = el.closest("a");
  if (!anchor || anchor.getAttribute("target") !== "_blank") return;
  const original = anchor.getAttribute("original-href");
  const href = anchor.getAttribute("href");
  // 手写的中转链接（无 original-href）交给整页兜底
  if (!original && href && href.includes("/redirect.html")) return;
  if (!open(original || href, anchor)) return;
  event.preventDefault();
};

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
  window.$jump = { open };
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick, true);
  if (window.$jump?.open === open) delete window.$jump;
  stopCountdown();
});
</script>

<style lang="scss" scoped>
.jump-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .jump-tip {
    font-size: 0.9rem;
    opacity: 0.85;
  }

  .jump-url {
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--main-card-border);
    border-radius: 10px;
    background-color: var(--main-card-second-background);
    font-size: 0.82rem;
    line-height: 1.5;
    word-break: break-all;
    // 允许选中：方便用户复制目标地址自行核查
    user-select: text;
  }

  .jump-status {
    font-size: 0.85rem;

    &.safe {
      color: var(--main-success-color);
    }

    &.warn {
      color: var(--main-warning-color);
    }

    &.danger {
      color: var(--main-error-color);
    }
  }

  .jump-actions {
    display: flex;
    gap: 0.6rem;
  }

  .jump-btn {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 42px;
    border-radius: 10px;
    font-size: 0.92rem;
    cursor: pointer;
    user-select: none;
    transition:
      background-color 0.3s,
      color 0.3s,
      box-shadow var(--press-out) var(--press-ease),
      transform var(--press-out) var(--press-ease);

    &:active {
      transform: scale(0.96);
      transition-duration: var(--press-in);
    }

    &.ghost {
      border: 1px solid var(--main-card-border);
      background-color: var(--main-card-second-background);

      &:hover {
        color: var(--main-color);
      }
    }

    &.primary {
      color: var(--main-card-background);
      background-color: var(--main-color);

      &:hover {
        box-shadow: 0 8px 16px -4px var(--main-border-shadow);
      }
    }

    &.disabled {
      color: var(--main-card-background);
      background-color: var(--main-error-color);
      cursor: not-allowed;
      opacity: 0.6;

      &:active {
        transform: none;
      }
    }
  }
}
</style>
