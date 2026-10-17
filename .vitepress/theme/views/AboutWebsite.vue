<template>
  <div class="about">
    <h1 class="title">关于本站</h1>
    <div class="about-content" style="grid-template-columns: 3fr 2fr">
      <div class="about-item hello">
        <span class="title2">一个莫名其妙的小站(?)</span>
        <span class="text4">
          欢迎来到泠の小站w<br />
          这里会有很多奇奇怪怪的东西哦（x<br />
          那就，请多指教啦
        </span>
      </div>
      <div class="about-item skills" style="padding-top: 2rem">
        <span class="title2">我不会的玩意</span>
        <div class="skills-list">
          <a
            v-for="(item, index) in skillsData"
            :key="index"
            :style="{ '--color': item.color }"
            :href="item.link"
            class="skills-item"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="skills-logo">
              <i :class="`iconfont icon-${item.icon}`"></i>
            </div>
            <span class="skills-name">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
    <div class="about-content" style="grid-template-columns: 2fr 3fr">
      <div class="about-item static image" style="--color: #3c3c4380">
        <div class="image-content">
          <span class="tip">数据</span>
          <span class="title2">站点数据</span>
          <div class="static-data">
            <div class="static-item">
              <span class="static-name">总访问量</span>
              <span id="busuanzi_value_site_pv" class="static-num">0</span>
            </div>
            <div class="static-item">
              <span class="static-name">总访客数</span>
              <span id="busuanzi_value_site_uv" class="static-num">0</span>
            </div>
          </div>
          <div class="image-desc opacity">
            <span class="left">
              统计信息来自
              <a href="https://busuanzi.ibruce.info/" target="_blank" rel="noopener noreferrer"
                >不蒜子</a
              >
            </span>
          </div>
        </div>
      </div>

      <div class="about-item child">
        <div
          class="about-item"
          style="padding: 1.2rem 1.2rem 1.2rem 1.8rem; justify-content: center"
        >
          <span class="title2"
            ><strong>sgexilq</strong><strong style="color: var(--main-color)">.</strong
            ><strong style="color: var(--main-color)">com</strong></span
          >
        </div>
        <div
          class="about-item info"
          style="align-items: center; justify-content: center; padding-left: 1.7rem"
        >
          <span class="title2" style="white-space: nowrap">
            <span>本站上线了</span>&nbsp;&nbsp;<span style="color: var(--main-accent)">{{
              daysOnline === null ? "--" : daysOnline
            }}</span
            >&nbsp;&nbsp;<span>天</span>
          </span>
        </div>
      </div>
    </div>
    <!-- 站点状态 -->
    <div class="about-content" style="display: flex">
      <div class="about-item" style="padding: 1.2rem 2rem">
        <p class="text" style="margin: 0.2rem 0; font-size: 1.6em">
          <strong style="color: var(--main-color)">站点信息</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          最近一次功能性或质量性更新于
          <strong style="color: var(--main-accent)">{{ displaySiteVersionDate }}</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          定义版本为 <strong style="color: var(--main-accent)">{{ displaySiteVersion }}</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          定义版本随 <strong style="color: var(--main-color)">release</strong> 推送更新
        </p>
        <p class="text" style="margin: 0.2rem 0">
          当前分支内部版本
          <strong style="color: var(--main-accent)">{{ displayBranchVersion }}</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          内部版本构建时间
          <strong style="color: var(--main-accent)">{{ displayBranchBuildTime }}</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          本站可用域名
          <strong style="color: var(--main-accent)"
            >sgexilq.com / sgexilq.top / mrsksyrx.top</strong
          >
        </p>
        <p class="text" style="margin: 0.2rem 0">
          服务域名 <strong style="color: var(--main-accent)">20091010.xyz</strong>
        </p>
        <p class="text" style="margin: 0.2rem 0">
          本站的
          <a
            href="https://sgexilq.com/pages/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--main-color)"
            ><strong>隐私政策</strong></a
          >
          与
          <a
            href="https://sgexilq.com/pages/cc"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--main-color)"
            ><strong>版权协议</strong></a
          >
        </p>
        <p class="text" style="margin: 0.2rem 0">
          订阅本站
          <a
            href="https://sgexilq.com/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--main-color)"
            ><strong>https://sgexilq.com/rss.xml</strong></a
          >
        </p>
        <p class="text" style="margin: 0.2rem 0">
          站点状态提供
          <a
            href="https://status.sgexilq.com"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--main-color)"
            ><strong>Better Stack</strong></a
          >
        </p>
        <p class="text" style="margin: 0.2rem 0">
          反馈建议
          <a href="mailto:feedback@sgexilq.com" style="color: var(--main-color)"
            ><strong>feedback@sgexilq.com</strong></a
          >
        </p>
        <p class="text" style="margin: 0.2rem 0">
          本站开源地址
          <a
            href="https://github.com/mrsksyrx/vitepress-theme-curve"
            target="_blank"
            rel="noopener noreferrer"
            style="color: var(--main-color)"
            ><strong>https://github.com/mrsksyrx/vitepress-theme-curve</strong></a
          >
        </p>
      </div>
    </div>
    <!-- 下方卡片 -->
    <div class="about-content" style="display: flex">
      <div class="about-item">
        <span class="tip">上游致谢</span>
        <span class="title2" style="margin-bottom: 0.8rem">vitepress-theme-curve</span>
        <p class="text">
          本站基于开源项目
          <a
            href="https://github.com/kazukokawagawa/vitepress-theme-curve"
            target="_blank"
            rel="noopener noreferrer"
            ><strong>vitepress-theme-curve</strong></a
          >
          构建，感谢原作者
          <a href="https://chiyu.it/" target="_blank" rel="noopener noreferrer"
            ><strong>池鱼</strong></a
          >
          的开源贡献
        </p>
        <p class="text">
          本站遵循
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            ><strong>AGPL v3</strong></a
          >
          协议<a
            href="https://github.com/mrsksyrx/vitepress-theme-curve"
            target="_blank"
            rel="noopener noreferrer"
            ><strong>开源</strong></a
          >
        </p>
        <p class="text" style="opacity: 0.4">
          技术栈：<a href="https://vitepress.dev/" target="_blank" rel="noopener noreferrer"
            >VitePress</a
          >
          · <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">Vue 3</a> ·
          <a href="https://pinia.vuejs.org/" target="_blank" rel="noopener noreferrer">Pinia</a> ·
          <a href="https://sass-lang.com/" target="_blank" rel="noopener noreferrer">SCSS</a>
        </p>
        <p class="text" style="color: var(--main-accent); margin-top: 0.4rem">
          本站的诞生离不开上游作者的开源贡献。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { loadScript } from "@/utils/commonTools";
import { mainStore } from "@/store";
import { daysPassedAt, useClientNow } from "@/utils/useClientNow.mjs";
import { toLocalDayTimestamp } from "@/utils/dateAnchor.mjs";

const { theme } = useData();
const store = mainStore();

// 站点版本信息（store 优先，fallback 到 themeConfig）
const displaySiteVersion = computed(() => store.siteVersion || theme.value.siteVersion);
const displaySiteVersionDate = computed(() => store.siteVersionDate || theme.value.siteVersionDate);
const displayBranchVersion = computed(() => store.branchVersion ?? theme.value.branchVersion);
const displayBranchBuildTime = computed(
  () => store.branchBuildTime || theme.value.branchBuildTime || "--",
);

// 站点上线天数：本地日历天口径，客户端时钟实时计算，避免 SSG 固化构建日天数
const { now } = useClientNow();
const daysOnline = computed(() => daysPassedAt(toLocalDayTimestamp("2026-08-19"), now.value));

// 技能数据

const skillsData = [
  {
    name: "JavaScript",
    color: "#f1e05abd",
    icon: "javascript",
    link: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript",
  },
  {
    name: "HTML5",
    color: "#e34f26",
    icon: "html5",
    link: "https://developer.mozilla.org/zh-CN/docs/Web/HTML",
  },
  {
    name: "CSS3",
    color: "#563d7c",
    icon: "css3",
    link: "https://developer.mozilla.org/zh-CN/docs/Web/CSS",
  },
  {
    name: "Vue",
    color: "#41b883",
    icon: "vue",
    link: "https://cn.vuejs.org/",
  },
  {
    name: "React",
    color: "#149ECA",
    icon: "react",
    link: "https://zh-hans.reactjs.org/",
  },
  {
    name: "Node.js",
    color: "#026E00",
    icon: "nodejs",
    link: "https://nodejs.org/",
  },
  {
    name: "Python",
    color: "#3776AB",
    icon: "python",
    link: "https://www.python.org/",
  },
  {
    name: "Docker",
    color: "#2496f2",
    icon: "docker",
    link: "https://www.docker.com/",
  },
  {
    name: "Git",
    color: "#F05032",
    icon: "git",
    link: "https://git-scm.com/",
  },
  {
    name: "Photoshop",
    color: "#31A8FF",
    icon: "photoshop",
    link: "https://www.adobe.com/cn/lead/creativecloud/business.html",
  },
  {
    name: "XiaomiMiMO",
    color: "#FF6900",
    icon: "tools",
    link: "https://mimo.mi.com/",
  },
];

onMounted(() => {
  loadScript("https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js", {
    async: true,
    reload: true,
  });
});
</script>

<style lang="scss" scoped>
.about {
  .title {
    font-size: 2.4rem;
    text-align: center;
    border: none;
    padding-bottom: 0;
  }
  .about-content {
    display: grid;
    grid-template-columns: auto auto;
    gap: 20px;
    margin-bottom: 20px;
    .about-item {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      padding: 1.2rem 2rem;
      border-radius: 12px;
      background-color: var(--main-card-background);
      border: 1px solid var(--main-card-border);
      box-shadow: 0 8px 12px -4px var(--main-border-shadow);
      overflow: hidden;
      .tip {
        font-size: 14px;
        opacity: 0.8;
        margin-bottom: 12px;
      }
      .title1 {
        font-size: 36px;
        font-weight: bold;
        opacity: 0.6;
      }
      .title2 {
        font-size: 36px;
        font-weight: bold;
        margin-right: 4rem;
      }
      .text {
        font-size: 18px;
        margin: 0.6rem 0;
      }
      &.child {
        background-color: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        gap: 20px;
        .about-item {
          height: 100%;
        }
      }
      &.hello {
        justify-content: center;
        padding: 2rem;
        background: var(--main-site-background);
        .title2 {
          line-height: 2;
        }
        .text4 {
          opacity: 0.5;
        }
      }
      &.pursuit {
        .title2 {
          line-height: 1.2;
          &:last-child {
            display: inline-block;
            background-size: 100% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-repeat: no-repeat;
            background-image: linear-gradient(45deg, #fa7671 50%, #f45f7f);
          }
        }
      }
      &.character {
        min-height: 220px;
        cursor: pointer;
        .more {
          margin-top: auto;
          font-size: 14px;
          color: var(--main-color-gray);
          a {
            color: var(--main-color-gray);
            &:hover {
              color: var(--color);
            }
          }
        }
        .male {
          position: absolute;
          top: 20px;
          right: -10px;
          height: 140%;
          width: auto;
          transition: transform 0.5s;
          transform-origin: top center;
          @media (max-width: 768px) {
            height: 80%;
          }
        }
        &:hover {
          .male {
            transform: scale(1.2);
          }
        }
      }
      &.skills {
        .skills-list {
          margin-top: 12px;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          .skills-item {
            display: flex;
            align-items: center;
            margin-right: 10px;
            margin-top: 10px;
            padding: 8px 12px 8px 8px;
            border-radius: 40px;
            background: var(--main-site-background);
            border: 1px solid var(--main-card-border);
            box-shadow: 0 8px 12px -4px var(--main-border-shadow);
            transition:
              background-color 0.3s,
              transform var(--press-out) var(--press-ease);
            cursor: pointer;
            .skills-logo {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              margin-right: 8px;
              border-radius: 50%;
              background-color: var(--color);
              .iconfont {
                color: #fff;
              }
            }
            .skills-name {
              font-weight: bold;
              transition: color 0.3s;
            }
            &:hover {
              background-color: var(--main-card-background);
            }
            &:active {
              transform: scale(0.95);
              transition-duration: var(--press-in);
            }
          }
        }
      }
      &.career {
        .title2 {
          letter-spacing: 0.2rem;
          font-size: 40px;
        }
        .list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          .list-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-bottom: 12px;
            color: var(--main-font-second-color);
            &::before {
              content: "";
              display: block;
              width: 16px;
              height: 16px;
              background-color: var(--color);
              border-radius: 50%;
              margin-right: 8px;
            }
          }
        }
        .career-img {
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          @media (max-width: 768px) {
            position: static;
          }
        }
      }
      &.game {
        min-height: 300px;
        @media (max-width: 768px) {
          min-height: 240px;
        }
      }
      &.like {
        min-height: 400px;
        @media (max-width: 768px) {
          min-height: 300px;
        }
      }
      &.image {
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        .image-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          z-index: 2;
          color: var(--main-font-color);
          .image-desc {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-top: auto;
            &.opacity {
              font-size: 14px;
              color: var(--main-font-second-color);
              opacity: 0.8;
              a {
                color: var(--main-font-second-color);
                &:hover {
                  color: var(--main-color);
                }
              }
            }
          }
        }
        &::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          box-shadow: none;
          z-index: 0;
        }
      }
      &.static {
        .static-data {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr 1fr;
          margin: 20px 0;
          .static-item {
            display: flex;
            flex-direction: column;
            .static-name {
              font-size: 15px;
              opacity: 0.8;
            }
            .static-num {
              font-size: 34px;
              font-weight: bold;
            }
          }
        }
      }
      &.map {
        min-height: 170px;
        background-size: 100%;
        transition: background 1.5s ease-in-out;
        cursor: pointer;
        @media (max-width: 768px) {
          background-size: cover;
          pointer-events: none;
        }
        .position {
          display: block;
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          padding: 20px 30px;
          color: #fff;
          background-color: #636352;
          font-size: 20px;
          transition: bottom 1s;
        }
        &:hover {
          background-size: 120%;
          background-position-x: 0;
          background-position-y: 36%;
          .position {
            bottom: -80px;
          }
        }
      }
      &.info {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
        gap: 1.25rem 2rem;
        .info-item {
          display: flex;
          flex-direction: column;
          min-width: 0;
          .info-name {
            font-size: 14px;
            margin-bottom: 8px;
            color: var(--main-font-second-color);
          }
          .info-num {
            font-size: 34px;
            font-weight: bold;
            color: var(--color);
          }
        }
      }
    }
    &:last-child {
      margin-bottom: 0;
    }
    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;

      .about-item {
        padding: 1.2rem 1.25rem;

        .title1 {
          font-size: 2rem;
        }

        .title2 {
          font-size: clamp(1.5rem, 8vw, 2rem);
          margin-right: 0;
          overflow-wrap: anywhere;
        }

        .text {
          font-size: 1rem;
        }

        &.static .static-data .static-item .static-num,
        &.info .info-item .info-num {
          font-size: 1.75rem;
        }

        &.map .position {
          padding: 1rem 1.25rem;
          font-size: 1rem;
        }

        &.info {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem 1rem;

          .info-item {
            margin-right: 0;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
html.dark .about .about-item.hello {
  color: var(--main-font-color);
}
</style>
