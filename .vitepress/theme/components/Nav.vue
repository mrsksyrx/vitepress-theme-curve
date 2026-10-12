<template>
  <header class="main-header">
    <nav :class="['main-nav', scrollData.direction, { top: scrollData.height === 0 }]">
      <div class="nav-all">
        <!-- 导航栏左侧 -->
        <div class="left-nav">
          <!-- 移动端返回按钮 -->
          <div
            v-show="isMobileLayout && frontmatter.layout !== 'home'"
            class="back-btn nav-btn"
            title="返回"
            @click="goBack"
          >
            <i class="iconfont icon-left"></i>
          </div>
          <div class="more-menu nav-btn" title="更多内容">
            <i class="iconfont icon-menu" />
            <span class="site-name">{{ site.title }}</span>
            <div class="more-card s-card">
              <div v-for="(item, index) in theme.navMore" :key="index" class="more-item">
                <div class="more-list">
                  <a
                    v-for="(link, i) in item.list"
                    :key="i"
                    :href="link.url"
                    class="more-link"
                    :target="link.url.startsWith('/') ? '_self' : '_blank'"
                  >
                    <span class="link-name">{{ link.name }}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 导航栏菜单 -->
        <div class="nav-center">
          <div class="site-menu">
            <div v-for="(item, index) in theme.nav" :key="index" class="menu-item">
              <span class="link-btn"> {{ item.text }}</span>
              <div v-if="item.items" class="link-child">
                <span
                  v-for="(child, childIndex) in desktopNavItems(item.items)"
                  :key="childIndex"
                  class="link-child-btn"
                  @click="goLink(child.link)"
                >
                  <i v-if="child.icon" :class="`iconfont icon-${child.icon}`" />
                  {{ child.text }}
                </span>
              </div>
            </div>
          </div>
          <span class="site-title" @click="smoothScrolling">
            {{ (frontmatter.home ? site.description : page.title) || site.description }}
          </span>
        </div>
        <div class="right-nav">
          <!-- 开往 -->
          <!--
          <a
            class="menu-btn nav-btn travellings"
            title="开往-友链接力"
            href="https://www.travellings.cn/go.html"
            target="_blank"
          >
            <i class="iconfont icon-subway"></i>
          </a>
        -->
          <!-- 随机文章（桌面端） -->
          <div class="menu-btn nav-btn pc" title="随机前往一篇文章" @click="shuffleGo">
            <i class="iconfont icon-shuffle"></i>
          </div>
          <!-- 搜索 -->
          <div
            v-if="theme.search?.enable"
            class="menu-btn nav-btn"
            title="全站搜索"
            @click="store.changeShowStatus('searchShow')"
          >
            <i class="iconfont icon-search"></i>
          </div>
          <!-- 中控台 -->
          <div id="open-control" class="menu-btn nav-btn pc control-menu" title="中控台">
            <i class="iconfont icon-dashboard" />
            <div class="control-popup">
              <div
                :class="['control-item', { open: store.themeType !== 'auto' }]"
                title="显示模式切换"
                @click="store.changeThemeType"
              >
                <i :class="`iconfont icon-${store.themeType}`"></i>
              </div>
              <div
                class="control-capsule"
                title="个性化配置"
                @click="store.changeShowStatus('showSettings')"
              >
                <i class="iconfont icon-style"></i>
                <span class="capsule-text">个性化配置</span>
              </div>
            </div>
          </div>
          <!-- 返回顶部 -->
          <div
            :class="[
              'to-top',
              'menu-btn',
              { hidden: scrollData.height === 0, long: scrollData.percentage > 90 },
            ]"
            title="返回顶部"
            @click="smoothScrolling"
          >
            <div class="to-top-btn">
              <Transition name="fade" mode="out-in">
                <span :key="scrollData.percentage > 90" class="num">
                  {{ scrollData.percentage <= 90 ? scrollData.percentage : "返回顶部" }}
                </span>
              </Transition>
              <i class="iconfont icon-up"></i>
            </div>
          </div>
          <!-- 移动端菜单 -->
          <div
            class="menu-btn nav-btn mobile"
            title="打开菜单"
            @click="store.changeShowStatus('mobileMenuShow')"
          >
            <i class="iconfont icon-toc" />
          </div>
        </div>
      </div>
    </nav>
    <!-- 移动端菜单 -->
    <MobileMenu />
    <!-- 全局搜索 -->
    <ClientOnly>
      <SearchModal v-if="theme.search?.enable" />
    </ClientOnly>
  </header>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import { smoothScrolling, shufflePost } from "@/utils/helper";
import { usePostData } from "@/utils/usePostData.mjs";
import { useIsMobileLayout } from "@/utils/layout.js";

const router = useRouter();
const store = mainStore();
const { loadPostData } = usePostData();
const isMobileLayout = useIsMobileLayout();
const app = getCurrentInstance()?.appContext.app;
const SearchModal = defineAsyncComponent(async () => {
  const [{ default: InstantSearch }, searchComponent] = await Promise.all([
    import("vue-instantsearch/vue3/es"),
    import("@/components/Search.vue"),
  ]);

  app?.use(InstantSearch);
  return searchComponent.default;
});
const { scrollData } = storeToRefs(store);
const { site, theme, frontmatter, page } = useData();

// 标记 mobileOnly 的入口只在移动端侧栏出现
const desktopNavItems = (items) => (items || []).filter((item) => !item.mobileOnly);

// 移动端返回
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    router.go("/");
  }
};

// 随机文章
const shuffleGo = async () => {
  const data = await loadPostData();
  if (data?.length) {
    router.go(shufflePost(data));
  }
};

// 站外链接交给浏览器新开标签，router.go 会丢弃 origin 把用户送回站内
const goLink = (link) => {
  if (!link) return;
  if (/^https?:\/\//i.test(link)) {
    window.open(link, "_blank", "noopener,noreferrer");
    return;
  }
  router.go(link);
};

// [B50] 死代码：rightMenuSwitch 定义后无任何调用（模板与脚本均未引用），
// 右键开关实际由 Settings.vue 的 setRightMenu 接管。注释保留，勿物理删除。
// 右键菜单开关
// const rightMenuSwitch = () => {
//   store.useRightMenu = !store.useRightMenu;
//   if (typeof $message !== "undefined") {
//     $message.info(`${store.useRightMenu ? "已开启" : "已关闭"}自定义右键菜单`);
//   }
// };
</script>

<style lang="scss" scoped>
.main-header {
  position: relative;
  width: 100%;
  height: 60px;
  overflow: hidden;
  z-index: 1000;
  animation: show 0.3s backwards;
  .main-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 60px;
    background: color-mix(in srgb, var(--main-card-background) 80%, transparent);
    transition:
      background-color 0.3s,
      backdrop-filter 0.3s;
    &::after {
      content: "";
      position: absolute;
      height: 80px;
      width: 100%;
      left: 0;
      bottom: -80px;
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, var(--main-card-background) 30%, transparent),
        transparent
      );
      pointer-events: none;
      transition: opacity 0.3s;
    }
    &.top {
      background: transparent;
      outline: 0px;
      &::after {
        opacity: 0;
      }
    }
    &.top,
    &.up {
      .nav-all {
        .site-menu {
          transform: translateY(0);
          opacity: 1;
        }
        .site-title {
          transform: translateY(50px);
          opacity: 0;
        }
        @media (max-width: 768px) {
          .left-nav,
          .right-nav {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
            transition:
              opacity 0.3s,
              visibility 0s;
          }
          .nav-center {
            visibility: hidden;
            opacity: 0;
            pointer-events: none;
            transition:
              opacity 0.3s,
              visibility 0s 0.3s;
          }
        }
        .force-mobile & {
          .left-nav,
          .right-nav {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
            transition:
              opacity 0.3s,
              visibility 0s;
          }
          .nav-center {
            visibility: hidden;
            opacity: 0;
            pointer-events: none;
            transition:
              opacity 0.3s,
              visibility 0s 0.3s;
          }
        }
      }
    }
    @media (max-width: 768px) {
      &:not(.top):not(.up) {
        .nav-all {
          .left-nav,
          .right-nav {
            visibility: hidden;
            opacity: 0;
            pointer-events: none;
            transition:
              opacity 0.3s,
              visibility 0s 0.3s;
          }
          .nav-center {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
            transition:
              opacity 0.3s,
              visibility 0s;
          }
        }
      }
    }
    .force-mobile &:not(.top):not(.up) {
      .nav-all {
        .left-nav,
        .right-nav {
          visibility: hidden;
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.3s,
            visibility 0s 0.3s;
        }
        .nav-center {
          visibility: visible;
          opacity: 1;
          pointer-events: auto;
          transition:
            opacity 0.3s,
            visibility 0s;
        }
      }
    }
  }
  .nav-all {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 1400px;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: minmax(200px, 1fr) auto minmax(200px, 1fr);
    align-items: center;
    .left-nav {
      display: flex;
      flex-direction: row;
      align-items: center;
      min-width: 200px;
      .more-menu {
        position: relative;
        margin-right: 4px;
        justify-content: flex-start;
        width: 120px;
        padding-left: 9px;
        border-radius: 50px;
        @media (max-width: 512px) {
          display: none;
        }
        .more-card {
          position: absolute;
          left: 0;
          top: 46px;
          opacity: 0;
          visibility: hidden;
          transform-origin: left top;
          transform: translateY(-10px) scale(0.8);
          padding: 6px 2px;
          background-color: var(--main-card-background);
          border: 1px solid var(--main-color);
          box-shadow: 0 8px 12px -3px var(--main-color-bg);
          border-radius: 28px;
          transition:
            opacity 0.3s,
            visibility 0.3s,
            transform 0.3s;
          .more-item {
            .more-list {
              display: flex;
              flex-direction: column;
              .more-link {
                display: flex;
                align-items: center;
                height: 42px;
                line-height: 50px;
                padding: 0 1.8rem 0 2rem;
                border-radius: 100px;
                white-space: nowrap;
                margin: 0 4px;
                transition:
                  color 0.3s,
                  padding 0.3s,
                  background-color 0.3s,
                  box-shadow 0.3s;
                &:hover {
                  color: var(--main-card-background);
                  background-color: var(--main-color);
                  box-shadow: 0 8px 12px -3px var(--main-color-bg);
                  padding: 0 1.8rem 0 2.4rem;
                  .iconfont {
                    color: var(--main-card-background);
                  }
                }
              }
            }
          }
          &::after {
            content: "";
            position: absolute;
            top: -20px;
            left: 0;
            width: 100%;
            height: 30px;
            z-index: 1;
          }
          &:hover {
            border-color: var(--main-color);
          }
        }
        &:hover {
          .more-card {
            opacity: 1;
            transform: translateY(0) scale(1);
            visibility: visible;
          }
        }
      }
      .site-name {
        font-size: 16px;
        font-weight: bold;
        white-space: nowrap;
        margin-left: 8px;
        margin-top: -1px;
        transition: color 0.3s;
      }
    }
    .nav-center {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      width: 100%;
      height: 60px;
      overflow: hidden;
      transition: top 0.3s;
      .site-menu {
        position: absolute;
        width: fit-content;
        min-height: 60px;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        z-index: 10;
        opacity: 0;
        transform: translateY(-50px);
        transition:
          transform 0.3s,
          opacity 0.3s;
        .menu-item {
          position: relative;
          padding: 0 0.4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: auto;
          cursor: pointer;
          .link-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: 0.2rem;
            padding: 0 0.8rem 0 1rem;
            font-weight: bold;
            height: 35px;
            line-height: 35px;
            border-radius: 50px;
            transition:
              color 0.3s,
              background-color 0.3s;
          }
          .link-child {
            position: absolute;
            top: 35px;
            margin-top: 8px;
            padding: 6px 2px;
            display: flex;
            flex-direction: row;
            align-items: center;
            background-color: var(--main-card-background);
            border: 1px solid var(--main-color);
            box-shadow: 0 8px 12px -3px var(--main-color-bg);
            border-radius: 50px;
            transform: translateY(-10px) scale(0.8);
            opacity: 0;
            visibility: hidden;
            transition:
              opacity 0.3s,
              visibility 0.3s,
              transform 0.3s;
            &::before {
              content: "";
              position: absolute;
              top: -14px;
              left: 0;
              width: 100%;
              height: 20px;
            }
            .link-child-btn {
              display: flex;
              align-items: center;
              border-radius: 100px;
              margin: 0 4px;
              padding: 0.6rem 0.8rem;
              white-space: nowrap;
              transition:
                color 0.3s,
                padding 0.3s,
                background-color 0.3s,
                box-shadow 0.3s;
              .iconfont {
                margin-right: 8px;
                font-size: 20px;
                transition: color 0.3s;
              }
              &:hover {
                color: var(--main-card-background);
                background-color: var(--main-color);
                box-shadow: 0 8px 12px -3px var(--main-color-bg);
                padding: 0.6rem 1rem;
                .iconfont {
                  color: var(--main-card-background);
                }
              }
            }
          }
          &:first-child {
            .link-child {
              &::after {
                content: "";
                position: absolute;
                top: -60px;
                left: 0;
                width: 50%;
                height: 60px;
              }
            }
          }
          &:last-child {
            .link-child {
              &::after {
                content: "";
                position: absolute;
                top: -60px;
                right: 0;
                width: 50%;
                height: 60px;
              }
            }
          }
          &:hover {
            .link-btn {
              color: var(--main-card-background);
              background-color: var(--main-color);
            }
            .link-child {
              transform: translateY(0) scale(1);
              opacity: 1;
              visibility: visible;
            }
          }
        }
      }
      .site-title {
        position: relative;
        display: inline-block;
        width: 100%;
        min-width: 280px;
        height: 35px;
        font-weight: bold;
        font-size: 18px;
        padding: 4px 8px;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        transition:
          transform 0.3s,
          opacity 0.3s;
        cursor: pointer;
        &::after {
          content: "返回顶部";
          position: absolute;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 35px;
          font-size: 16px;
          border-radius: 50px;
          color: var(--main-card-background);
          background-color: var(--main-color);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 1;
        }
        &:hover {
          &::after {
            opacity: 1;
          }
        }
        &:active {
          transform: scale(0.95);
        }
        @media (max-width: 768px) {
          &::after {
            display: none;
          }
        }
      }
    }
    .right-nav {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      min-width: 200px;
      .menu-btn {
        margin-left: 0.5rem;
        &.mobile {
          display: none;
        }
        &.pc {
          display: flex;
        }
        @media (max-width: 768px) {
          &.mobile {
            display: flex;
          }
          &.pc {
            display: none;
          }
        }
      }
      .control-menu {
        position: relative;
        .control-popup {
          position: absolute;
          top: 46px;
          right: 0;
          opacity: 0;
          visibility: hidden;
          transform-origin: right top;
          transform: translateY(-10px) scale(0.8);
          padding: 6px 2px;
          display: flex;
          flex-direction: row;
          align-items: center;
          background-color: var(--main-card-background);
          border: 1.5px solid var(--main-color);
          box-shadow: 0 8px 12px -3px var(--main-color-bg);
          border-radius: 50px;
          transition:
            opacity 0.3s,
            visibility 0.3s,
            transform 0.3s;
          &::before {
            content: "";
            position: absolute;
            top: -20px;
            right: 0;
            width: 100%;
            height: 30px;
          }
          .control-item {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 4px;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border: none;
            background-color: transparent;
            transition:
              transform 0.3s,
              background-color 0.3s;
            cursor: pointer;
            .iconfont {
              font-size: 18px;
              color: var(--main-font-color);
              transition: color 0.3s;
            }
            &:hover {
              background-color: var(--main-color);
              .iconfont {
                color: #fff;
              }
            }
          }
          .control-capsule {
            display: flex;
            align-items: center;
            margin: 0 4px;
            height: 42px;
            padding: 0 12px;
            border-radius: 50px;
            border: none;
            background-color: transparent;
            white-space: nowrap;
            transition: background-color 0.3s;
            cursor: pointer;
            .iconfont {
              font-size: 18px;
              flex-shrink: 0;
              color: var(--main-font-color);
              transition: color 0.3s;
            }
            .capsule-text {
              font-size: 13px;
              margin-left: 8px;
              color: var(--main-font-color);
              transition: color 0.3s;
            }
            &:hover {
              background-color: var(--main-color);
              .iconfont,
              .capsule-text {
                color: #fff;
              }
            }
          }
        }
        &:hover {
          .control-popup {
            opacity: 1;
            transform: translateY(0) scale(1);
            visibility: visible;
          }
        }
      }
      .to-top {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 35px;
        height: 35px;
        transition: all 0.3s;
        cursor: pointer;
        .to-top-btn {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 25px;
          height: 25px;
          border-radius: 40px;
          background-color: var(--main-font-color);
          transition:
            width 0.3s,
            height 0.3s,
            background-color 0.3s;
          .num {
            position: absolute;
            font-size: 12px;
            color: var(--main-card-background);
            transition: opacity 0.1s;
          }
          .icon-up {
            position: absolute;
            color: var(--main-card-background);
            opacity: 0;
            transition: opacity 0.3s;
          }
        }

        &.hidden {
          width: 0;
          opacity: 0;
          transform: scale(0);
          margin: 0;
        }
        &.long {
          width: 80px;
          .to-top-btn {
            width: 70px;
          }
        }
        &:hover {
          .to-top-btn {
            width: 35px;
            height: 35px;
            background-color: var(--main-color);
            .num {
              opacity: 0;
            }
            .icon-up {
              opacity: 1;
            }
          }
          &.long {
            width: 80px;
            .to-top-btn {
              width: 80px;
              height: 35px;
            }
          }
        }
        &:active {
          transform: scale(0.9);
        }
      }
    }
    @mixin mobile-nav-styles {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      .left-nav,
      .right-nav {
        min-width: auto;
        visibility: visible;
        opacity: 1;
        pointer-events: auto;
        transition:
          opacity 0.3s,
          visibility 0s;
        .back-btn {
          display: flex;
        }
      }
      .nav-center {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--main-card-background);
        border-bottom: 1px solid var(--main-card-border);
        z-index: 100;
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
        transition:
          opacity 0.3s,
          visibility 0s 0.3s;
        .site-menu {
          display: none;
        }
        .site-title {
          font-size: 15px;
          height: auto;
        }
      }
    }
    @media (max-width: 768px) {
      @include mobile-nav-styles;
    }
    .force-mobile & {
      @include mobile-nav-styles;
    }
  }
  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    padding: 0;
    transition:
      background-color 0.3s,
      transform var(--press-out) var(--press-ease);
    border-radius: 50%;
    cursor: pointer;
    .iconfont {
      font-size: 20px;
      line-height: 1;
      transition:
        color 0.3s,
        opacity 0.3s;
    }
    &:hover {
      background-color: var(--main-color);
      .iconfont,
      .site-name {
        color: var(--main-card-background);
      }
    }
    // 按下反馈只给移动端布局，桌面端顶栏靠 hover 就够了
    @media (max-width: 768px) {
      html:not(.force-pc) &:active {
        transform: scale(0.9);
        transition-duration: var(--press-in);
      }
    }
    html.force-mobile &:active {
      transform: scale(0.9);
      transition-duration: var(--press-in);
    }
  }
}
</style>
