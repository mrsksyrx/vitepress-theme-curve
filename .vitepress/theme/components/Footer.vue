<template>
  <footer id="main-footer" class="main-footer">
    <div class="footer-content">
      <div class="copyright">
        <span class="time">@ {{ startYear }} - {{ thisYear }} By </span>
        <a
          :href="theme.siteMeta.author.link"
          class="author link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ theme.siteMeta.author.name }}
        </a>
        <a
          v-if="theme.icp"
          class="icp link"
          :href="icpLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="iconfont icon-safe" />
          {{ theme.icp }}
        </a>
        <SystemStatus />
      </div>
      <div class="meta">
        <!--
        <a class="power link" href="https://vitepress.dev/" target="_blank">
          <span class="by">Powered by</span>
          <span class="name">VitePress</span>
        </a>
        <a class="theme link" href="https://github.com/imsyy/vitepress-theme-curve" target="_blank">
          <span class="name">主题</span>
        </a>
        -->
        <a class="rss link" href="/rss.xml" target="_blank" rel="noopener noreferrer">
          <i class="iconfont icon-rss" />
          <span class="name">订阅</span>
        </a>
        <a
          class="cc link"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="iconfont icon-line" />
          <i class="iconfont icon-by-line" />
          <i class="iconfont icon-nc-line" />
          <i class="iconfont icon-nd-line" />
        </a>
        <a
          class="notbyai link"
          href="https://notbyai.fyi/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            class="light-badge"
            src="/notbyai/Written-By-Human-Not-By-AI-Badge-white.svg"
            alt="Written By Human"
          />
          <img
            class="dark-badge"
            src="/notbyai/Written-By-Human-Not-By-AI-Badge-black.svg"
            alt="Written By Human"
          />
        </a>
      </div>
      <div class="credit">
        本站的诞生离不开上游作者的开源贡献。在此感谢他（她）们。本站遵循
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          ><strong>AGPL v3</strong></a
        >
        协议
        <a
          href="https://github.com/mrsksyrx/vitepress-theme-curve"
          target="_blank"
          rel="noopener noreferrer"
          style="color: var(--main-color)"
          ><strong>开源</strong></a
        >
        。
      </div>
    </div>
  </footer>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import SystemStatus from "@/components/SystemStatus.vue";

const store = mainStore();
const { theme } = useData();
const { footerIsShow } = storeToRefs(store);

// 视窗监听器
const observer = ref(null);

// 版权起止年：起点读 theme.since，终点为当前年（SSR 取构建年，避免倒置区间）
const startYear = computed(() => {
  const y = String(theme.value.since ?? "").match(/(\d{4})/)?.[1];
  return y ?? String(new Date().getFullYear());
});
const thisYear = ref(new Date().getFullYear());

// 备案链接 keyword 从 theme.icp 提取，避免与显示文本漂移
const icpLink = computed(() => {
  const keyword = String(theme.value.icp ?? "").match(/\d+/)?.[0];
  return keyword ? `https://icp.gov.moe/?keyword=${keyword}` : "https://icp.gov.moe/";
});

// 监听页脚视窗
const isShowFooter = () => {
  const footerDom = document.getElementById("main-footer");
  if (!footerDom) return false;
  if (observer.value) observer.value?.disconnect();
  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      footerIsShow.value = entry.isIntersecting ? true : false;
    });
  });
  // 添加监视器
  observer.value?.observe(footerDom);
};

onMounted(() => {
  thisYear.value = new Date().getFullYear();
  isShowFooter();
});

onBeforeUnmount(() => {
  if (observer.value) observer.value?.disconnect();
});
</script>

<style lang="scss" scoped>
.main-footer {
  display: flex;
  margin-top: 1rem;
  padding: 1rem 0;
  background-color: var(--main-card-background);
  border-top: 1px solid var(--main-card-border);
  overflow: hidden;
  animation: show 0.3s backwards;
  transition:
    color 0.3s,
    border 0.3s,
    background-color 0.3s;
  .footer-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
    color: var(--main-font-color);
    line-height: 1;
    min-height: 32px;
    .copyright {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.1rem;

      .time {
        display: inline-flex;
        align-items: center;
      }

      .icp {
        .iconfont {
          font-size: 20px;
          opacity: 0.6;
        }
      }
      // .upyun {
      //  .iconfont {
      //    font-size: 20px;
      //    font-weight: normal;
      //  }
      //  }
    }
    .meta {
      display: flex;
      flex-direction: row;
      align-items: center;
      .power {
        margin-right: 4px;
        .by {
          font-weight: normal;
          opacity: 0.8;
          margin-right: 6px;
        }
      }
      .rss {
        margin-right: 4px;
        .iconfont {
          font-weight: normal;
          margin-right: 6px;
        }
      }
      .cc {
        .iconfont {
          margin: 0 2px;
          font-weight: normal;
        }
      }
      .notbyai {
        padding: 4px !important;
        img {
          height: 30px;
        }
        .light-badge {
          display: block;
        }
        .dark-badge {
          display: none;
        }
      }
    }
    .link {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      font-weight: bold;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      padding: 8px;
      margin: 0 2px;
      height: 38px;
      border-radius: 12px;
      transition:
        color 0.3s,
        background-color 0.3s,
        transform var(--press-out) var(--press-ease);
      cursor: pointer;
      .iconfont {
        font-size: 22px;
        margin-right: 4px;
        transition: color 0.3s;
      }
      &:hover {
        color: var(--main-color);
        background-color: var(--main-color-bg);
        .iconfont {
          color: var(--main-color);
        }
      }
      &:active {
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    @media (max-width: 768px) {
      font-size: 14px;
      .meta {
        display: none;
      }
      .copyright {
        .time,
        .author {
          display: none;
        }
      }
    }
    @media (max-width: 420px) {
      .copyright {
        .icp {
          .iconfont {
            display: none;
          }
        }
      }
    }
    .credit {
      width: 100%;
      text-align: center;
      font-size: 12px;
      opacity: 0.5;
      margin-top: 8px;
      a {
        color: var(--main-color);
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>

<style lang="scss">
html.dark .main-footer .notbyai {
  .light-badge {
    display: none !important;
  }
  .dark-badge {
    display: block !important;
  }
}
</style>
