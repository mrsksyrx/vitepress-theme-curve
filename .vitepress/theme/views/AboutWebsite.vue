<template>
  <div class="about">
    <h1 class="title">关于本站</h1>
    <div class="about-content" style="grid-template-columns: 3fr 2fr">
      <div class="about-item hello">
        <span class="title2">一个记录知识与生活的博客</span>
        <span class="text4">
          欢迎来到 My Curve Blog。<br />
          这里记录学习、开发与生活。<br />
          很高兴在这里与你相遇。
        </span>
      </div>
      <div class="about-item skills" style="padding-top: 2rem">
        <span class="title2">技术栈</span>
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
            ><strong>example</strong><strong style="color: var(--main-color)">.</strong
            ><strong style="color: var(--main-color)">com</strong></span
          >
        </div>
        <div
          class="about-item info"
          style="align-items: center; justify-content: center; padding-left: 1.7rem"
        >
          <span class="title2" style="white-space: nowrap">
            <span>本站已运行</span>&nbsp;&nbsp;<span style="color: var(--main-accent)">{{
              daysOnline === null ? "--" : daysOnline
            }}</span
            >&nbsp;&nbsp;<span>天</span>
          </span>
        </div>
      </div>
    </div>
    <!-- 下方卡片 -->
    <div class="about-content" style="display: flex">
      <div class="about-item">
        <span class="tip">上游致谢</span>
        <span class="title2" style="margin-bottom: 0.8rem">mrsksyrx / vitepress-theme-curve</span>
        <p class="text">
          本模板由
          <a href="https://github.com/mrsksyrx" target="_blank" rel="noopener noreferrer"
            ><strong>mrsksyrx</strong></a
          >
          维护，项目仓库为
          <a
            href="https://github.com/mrsksyrx/vitepress-theme-curve"
            target="_blank"
            rel="noopener noreferrer"
            ><strong>mrsksyrx/vitepress-theme-curve</strong></a
          >。
        </p>
        <p class="text">
          项目代码遵循
          <a href="https://opensource.org/license/mit" target="_blank" rel="noopener noreferrer"
            ><strong>MIT License</strong></a
          >
          发布。
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
          欢迎在仓库中提交 Issue 与建议。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { loadScript } from "@/utils/commonTools";

import { daysPassedAt, useClientNow } from "@/utils/useClientNow.mjs";
import { toLocalDayTimestamp } from "@/utils/dateAnchor.mjs";

// 站点上线天数：本地日历天口径，客户端时钟实时计算，避免 SSG 固化构建日天数
const { now } = useClientNow();
const daysOnline = computed(() => daysPassedAt(toLocalDayTimestamp("2026-01-01"), now.value));

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

        // 桌面端单行的 2 倍行高在小屏折行后间距过大；
        // 收紧行高后用外边距补回标题与边框、正文之间的呼吸空间
        &.hello .title2 {
          line-height: 1.4;
          margin: 0.6rem 0 1.2rem;
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
