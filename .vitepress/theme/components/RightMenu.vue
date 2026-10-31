<template>
  <Teleport to="body">
    <!-- 右键菜单 -->
    <Transition name="fade" mode="out-in">
      <div
        v-if="rightMenuShow"
        class="right-menu"
        @click="rightMenuShow = false"
        @contextmenu.stop="closeRightMenu"
      >
        <div
          :style="{
            left: rightMenuX + 'px',
            top: rightMenuY + 'px',
          }"
          ref="rightMenuRef"
          class="menu-content s-card hover"
          @contextmenu.stop="closeRightMenu"
        >
          <div class="tools">
            <div class="btn" title="后退" @click="rightMenuFunc('back')">
              <i class="iconfont icon-left"></i>
            </div>
            <div class="btn" title="前进" @click="rightMenuFunc('forward')">
              <i class="iconfont icon-right"></i>
            </div>
            <div class="btn" title="刷新" @click="rightMenuFunc('reload')">
              <i class="iconfont icon-refresh"></i>
            </div>
            <div class="btn" title="返回顶部" @click="smoothScrolling">
              <i class="iconfont icon-arrow-up"></i>
            </div>
          </div>
          <div class="all-menu">
            <div v-if="clickedType === 'normal'" class="btn" @click="shuffleGo">
              <i class="iconfont icon-shuffle"></i>
              <span class="name">随便逛逛</span>
            </div>
            <div
              v-if="clickedType === 'normal'"
              class="btn"
              @click="router.go('/pages/categories')"
            >
              <i class="iconfont icon-folder"></i>
              <span class="name">全部分类</span>
            </div>
            <div v-if="clickedType === 'normal'" class="btn" @click="router.go('/pages/tags')">
              <i class="iconfont icon-hashtag"></i>
              <span class="name">全部标签</span>
            </div>
            <!-- 链接类型 -->
            <div v-if="clickedType === 'link'" class="btn" @click="rightMenuFunc('open-link')">
              <i class="iconfont icon-window"></i>
              <span class="name">新标签页打开</span>
            </div>
            <div
              v-if="clickedType === 'link'"
              class="btn"
              @click="
                copyText(clickedTypeData?.getAttribute('original-href') || clickedTypeData?.href)
              "
            >
              <i class="iconfont icon-link"></i>
              <span class="name">复制链接地址</span>
            </div>
            <!-- 图片类型 -->
            <div
              v-if="clickedType === 'image'"
              class="btn"
              @click="copyImage(clickedTypeData?.src)"
            >
              <i class="iconfont icon-image-copy"></i>
              <span class="name">复制此图片</span>
            </div>
            <div
              v-if="clickedType === 'image'"
              class="btn"
              @click="downloadImage(clickedTypeData?.src)"
            >
              <i class="iconfont icon-download"></i>
              <span class="name">下载此图片</span>
            </div>
            <!-- 输入框 -->
            <div
              v-if="clickedType === 'input' && typeof clickedInputEl?.value === 'string'"
              class="btn"
              @click="rightMenuFunc('input-paste')"
            >
              <i class="iconfont icon-paste"></i>
              <span class="name">粘贴文本</span>
            </div>
            <!-- 选中文本 -->
            <a
              v-if="(clickedType === 'text' || clickedType === 'input') && isLink(clickedTypeData)"
              :href="`${isLink(clickedTypeData)}`"
              class="btn right-menu-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="iconfont icon-link"></i>
              <span class="name">在新标签页打开</span>
            </a>
            <!--
            <a
              v-if="clickedType === 'text' || clickedType === 'input'"
              :href="`https://www.baidu.com/s?wd=${encodeURIComponent(clickedTypeData)}`"
              class="btn right-menu-link"
              target="_blank"
            >
              <i class="iconfont icon-baidu"></i>
              <span class="name">使用百度搜索</span>
            </a>
            -->
            <a
              v-if="clickedType === 'text' || clickedType === 'input'"
              :href="`https://cn.bing.com/search?q=${encodeURIComponent(clickedText)}`"
              class="btn right-menu-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="iconfont icon-bing"></i>
              <span class="name">使用必应搜索</span>
            </a>
            <div
              v-if="clickedType === 'text' || clickedType === 'input'"
              class="btn"
              @click="copyClickedText()"
            >
              <i class="iconfont icon-copy"></i>
              <span class="name">复制选中文本</span>
            </div>
            <div
              v-if="clickedType === 'text' && !commentCopyShow && theme.comment.type === 'artalk'"
              class="btn"
              @click="commentCopy(clickedTypeData)"
            >
              <i class="iconfont icon-chat"></i>
              <span class="name">评论选中内容</span>
            </div>
          </div>
          <!-- 通用菜单 -->
          <!---
          <div class="all-menu general">
            !-- 版权协议 --
            <div class="btn" @click="router.go('/pages/cc')">
              <i class="iconfont icon-accessible"></i>
              <span class="name">版权协议</span>
            </div>
            !-- 隐私政策 --
            <div class="btn" @click="router.go('/pages/privacy')">
              <i class="iconfont icon-privacy"></i>
              <span class="name">隐私政策</span>
            </div>
          </div>
        -->
          <div class="all-menu general">
            <!-- 复制地址 -->
            <div class="btn" @click="rightMenuFunc('copy-link')">
              <i class="iconfont icon-copy"></i>
              <span class="name">复制本页地址</span>
            </div>
            <!-- 分享本页 -->
            <div class="btn" @click="rightMenuFunc('share-page')">
              <svg
                class="share-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span class="name">分享本页</span>
            </div>
            <!-- 明暗模式 -->
            <div class="btn" @click.stop="store.changeThemeType">
              <i
                :class="`iconfont icon-${themeType === 'auto' ? 'dark' : themeType === 'dark' ? 'light' : 'auto'}`"
              />
              <span class="name">
                {{ themeType === "auto" ? "深色模式" : themeType === "dark" ? "浅色模式" : "系统" }}
              </span>
            </div>
          </div>
          <!-- 播放器控制 -->
          <div
            v-if="
              playerShow &&
              theme.music?.enable === true &&
              playerData &&
              playerData.name !== '未知曲目'
            "
            class="all-menu general player"
          >
            <div class="data">
              <span class="name">{{ playerData.name }}</span>
              <span class="artist">{{ playerData.artist }}</span>
            </div>
            <div class="volume" @click.stop>
              <i
                class="iconfont icon-volume-down"
                @click="playerVolume = Math.max(0, playerVolume - 0.1)"
              />
              <Slider :value="playerVolume" @update="(val) => (playerVolume = val)" />
              <i
                class="iconfont icon-volume-up"
                @click="playerVolume = Math.min(1, playerVolume + 0.1)"
              />
            </div>
            <div class="control" @click.stop>
              <div class="btn" title="上一曲" @click="playerControl('prev')">
                <i class="iconfont icon-prev"></i>
              </div>
              <div v-if="playState" class="btn" title="暂停" @click="playerControl('toggle')">
                <i class="iconfont icon-pause"></i>
              </div>
              <div v-else class="btn" title="播放" @click="playerControl('toggle')">
                <i class="iconfont icon-play"></i>
              </div>
              <div class="btn" title="下一曲" @click="playerControl('next')">
                <i class="iconfont icon-next"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <!-- 快速评论 -->
    <Modal
      :show="commentCopyShow"
      title="快速评论"
      titleIcon="chat"
      @mask-click="commentCopyClose"
      @modal-close="commentCopyClose"
    >
      <span class="modal-tip"> 您无需删除现有的输入框内容，直接在下方评论即可 </span>
      <Artalk :fill="commentCopyData" />
    </Modal>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import {
  smoothScrolling,
  shufflePost,
  copyText,
  copyImage,
  downloadImage,
  openExternalUrl,
} from "@/utils/helper";
import { useIsMobileLayout } from "@/utils/layout.js";
import { usePostData } from "@/utils/usePostData.mjs";

const isMobileLayout = useIsMobileLayout();

const router = useRouter();
const store = mainStore();
const { theme } = useData();
// 文章索引（异步加载，不再是 theme.postData）
const { loadPostData } = usePostData();
const { useRightMenu, themeType, playerShow, playerVolume, playState, playerData } =
  storeToRefs(store);

onMounted(() => {
  // 挂载时预加载，避免首次右键点击才发起请求
  loadPostData();
});

// 右键菜单数据
const rightMenuX = ref(0);
const rightMenuY = ref(0);
const clickedType = ref("normal");
const clickedTypeData = ref(null);
// 输入框元素单独留一份引用：有选区时 clickedTypeData 会被选中文本（字符串）覆盖
const clickedInputEl = ref(null);
const rightMenuRef = ref(null);
const rightMenuShow = ref(false);

// 复制 / 搜索用文本（输入框取 input.value，避免拿到 DOM 对象）
const clickedText = computed(() => {
  const data = clickedTypeData.value;
  if (typeof data === "string") return data;
  if (data && typeof data.value === "string") return data.value;
  return "";
});

// 复制选中文本（空内容不提示复制成功）
const copyClickedText = () => {
  if (!clickedText.value) return;
  copyText(clickedText.value);
};

// 快速评论
const commentCopyShow = ref(false);
const commentCopyData = ref(null);

// 开启右键菜单
const openRightMenu = (e) => {
  // 检测是否可开启
  if (e.ctrlKey || !useRightMenu.value) return true;
  if (isMobileLayout.value) return true;
  e.preventDefault();
  rightMenuShow.value = false;
  // 获取点击类型
  checkClickType(e?.target);
  nextTick().then(() => {
    // 处理菜单位置
    const calculateMenuPosition = () => {
      // 获取菜单的宽度和高度
      const menuWidth = rightMenuRef.value?.offsetWidth;
      const menuHeight = rightMenuRef.value?.offsetHeight;
      // 获取屏幕的宽度和高度
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      // 计算正确的坐标值
      let correctX = e.clientX;
      let correctY = e.clientY;
      // 保留边距
      const marginWidth = 20;
      if (correctX + menuWidth > screenWidth - marginWidth) {
        correctX = screenWidth - menuWidth - marginWidth;
      }
      if (correctY + menuHeight > screenHeight - marginWidth) {
        correctY = screenHeight - menuHeight - marginWidth;
      }
      if (correctX < marginWidth) {
        correctX = marginWidth;
      }
      if (correctY < marginWidth) {
        correctY = marginWidth;
      }
      rightMenuX.value = correctX;
      rightMenuY.value = correctY;
    };
    // 显示菜单
    rightMenuShow.value = true;
    // DOM 更新
    nextTick().then(() => calculateMenuPosition());
  });
};

// 关闭右键菜单
const closeRightMenu = (e) => {
  e?.preventDefault();
  rightMenuShow.value = false;
  rightMenuX.value = 0;
  rightMenuY.value = 0;
  clickedType.value = "normal";
  clickedTypeData.value = null;
  clickedInputEl.value = null;
  commentCopyData.value = false;
};

// 判断点击元素类型
const checkClickType = (target) => {
  if (!target?.tagName) return false;
  const selectionText = window.getSelection()?.toString() ?? "";
  const hasSelection = selectionText.length > 0;
  clickedInputEl.value = null;
  // closest 识别嵌套在链接 / 图片内部的图标、SVG 等子元素
  const imgEl = target.tagName === "IMG" ? target : target.closest?.("img");
  const linkEl = target.tagName === "A" ? target : target.closest?.("a[href]");
  if (imgEl) {
    // 图片类型（链接内图片也优先保留复制 / 下载图片能力）
    clickedType.value = "image";
    clickedTypeData.value = imgEl;
  } else if (linkEl) {
    // 链接类型（链接内部图标、SVG 归为链接）
    clickedType.value = "link";
    clickedTypeData.value = linkEl;
  } else if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
    // 输入框类型
    clickedType.value = "input";
    clickedInputEl.value = target;
    clickedTypeData.value = hasSelection ? selectionText : target;
  } else if (hasSelection) {
    // 已选中的文本
    clickedType.value = "text";
    clickedTypeData.value = selectionText;
  } else {
    // 普通模式
    clickedType.value = "normal";
    clickedTypeData.value = target;
  }
};

// 随机文章
const shuffleGo = async () => {
  rightMenuShow.value = false;
  const data = await loadPostData();
  if (data?.length) {
    router.go(shufflePost(data));
  }
};

// 右键菜单点击事件
const rightMenuFunc = async (type) => {
  try {
    if (!type) return false;
    switch (type) {
      case "back":
        window.history.back();
        break;
      case "forward":
        window.history.forward();
        break;
      case "reload":
        window.location.reload();
        break;
      case "open-link": {
        const linkUrl = clickedTypeData.value?.href;
        if (linkUrl && !openExternalUrl(linkUrl) && typeof $message !== "undefined") {
          $message.error("链接协议不受支持");
        }
        break;
      }
      case "copy-link":
        const pageLink =
          (theme.value?.siteMeta?.site || "").replace(/\/+$/, "") + router.route.path;
        if (!pageLink) {
          if (typeof $message !== "undefined") {
            $message.error("复制失败：无法获取页面地址");
          }
          return;
        }
        copyText(pageLink);
        break;
      case "share-page":
        closeRightMenu({ preventDefault() {} });
        nextTick(() => window.$share?.open());
        break;
      // 以下为源代码 2025.06.10修改
      // 修复内容：右键复制本页地址信息undefined
      // 问题原因：pageLink赋值错误
      //        const pageLink = theme.value.site + router.route.path;
      //        if (pageLink) copyText(pageLink);
      //        break;
      case "input-paste": {
        const text = await navigator.clipboard.readText();
        const inputElement = clickedInputEl.value;
        if (!inputElement || typeof inputElement !== "object") break;
        const value = typeof inputElement.value === "string" ? inputElement.value : "";
        // selectionStart / selectionEnd 在部分输入框上为 null，按追加到末尾处理
        const start = Number.isInteger(inputElement.selectionStart)
          ? inputElement.selectionStart
          : value.length;
        const end = Number.isInteger(inputElement.selectionEnd)
          ? inputElement.selectionEnd
          : value.length;
        // 优先 setRangeText：一步完成替换与光标定位，避免 setSelectionRange 抛错
        let replaced = false;
        if (typeof inputElement.setRangeText === "function") {
          try {
            inputElement.setRangeText(text, start, end, "end");
            replaced = true;
          } catch (error) {
            // 部分输入框不支持 setRangeText，回退到手动替换
          }
        }
        if (!replaced) {
          inputElement.value = value.slice(0, start) + text + value.slice(end);
          try {
            inputElement.setSelectionRange(start + text.length, start + text.length);
          } catch (error) {
            // 部分输入框不支持 setSelectionRange，忽略光标定位
          }
        }
        // 同步 v-model / 第三方组件（Artalk 等）的内部状态
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        break;
      }
      default:
        return false;
    }
  } catch (error) {
    if (typeof $message !== "undefined") {
      $message.error("右键菜单发生错误，请重试");
    }
    console.error("右键菜单出错：", error);
  }
};

// 播放器控制
const playerControl = (type) => {
  const player = window.$player;
  if (!player || !type) return false;
  switch (type) {
    case "toggle":
      player.toggle();
      break;
    case "next":
      player.skipForward();
      player.play();
      break;
    case "prev":
      player.skipBack();
      player.play();
      break;
    default:
      return false;
  }
};

// 选中内容是否为链接
const isLink = (data) => {
  // 只接受字符串，DOM 对象没有 trim()
  if (typeof data !== "string") return false;
  if (!data) return false;
  const text = data.trim();
  if (!text) return false;
  // 不再无条件补协议：原文本本身须形如 URL（已有协议 / www. 前缀，或裸域名含点分 TLD）
  const hasProtocolOrWww = /^(https?:\/\/|www\.)\S+$/i.test(text);
  const isBareDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(text);
  if (!hasProtocolOrWww && !isBareDomain) return false;
  const urlData = /^https?:\/\//i.test(text) ? text : `http://${text}`;
  try {
    const url = new URL(urlData);
    // 拒绝纯数字主机名（如 123.456、192.168.1.1）
    if (/^\d+(\.\d+)+$/.test(url.hostname)) return false;
    return urlData;
  } catch (error) {
    return false;
  }
};

// 评论选中内容
const commentCopy = (data) => {
  if (!data) return false;
  let commentData = "> " + data.trim().replace(/\s+/g, " ");
  if (commentData.length >= 200) {
    commentData = commentData.substring(0, 200) + "...";
  }
  commentCopyData.value = commentData;
  commentCopyShow.value = true;
};

// 关闭快速评论
const commentCopyClose = () => {
  commentCopyShow.value = false;
  if (typeof $comment !== "undefined") $comment.reload();
};

defineExpose({ openRightMenu });
</script>

<style lang="scss" scoped>
.right-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: var(--z-message);
  transition: opacity 0.2s;
  .menu-content {
    position: absolute;
    width: 180px;
    background-color: var(--main-card-background);
    animation: fade-up 0.2s forwards;
    transition:
      opacity 0.3s,
      border-color 0.3s,
      box-shadow 0.3s,
      background-color 0.3s;
    .tools {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--main-card-border);
      .btn {
        width: 34px;
        height: 34px;
        min-width: 34px;
      }
    }
    .all-menu {
      margin-top: 12px;
      .btn {
        justify-content: flex-start;
        margin-bottom: 6px;
        .iconfont {
          font-size: 20px;
        }
        &:last-child {
          margin-bottom: 0;
        }
      }
      &.general {
        padding-top: 12px;
        border-top: 1px solid var(--main-card-border);
      }
    }
    .player {
      .data {
        display: flex;
        flex-direction: column;
        align-items: center;
        span {
          width: 100%;
          padding: 0 8px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .artist {
          font-size: 14px;
          margin-top: 4px;
          color: var(--main-font-second-color);
        }
      }
      .volume {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 0 6px;
        margin-top: 1rem;
        width: 100%;
        .iconfont {
          color: var(--main-font-second-color);
          font-size: 20px;
          transition:
            color 0.3s,
            opacity 0.2s;
          cursor: pointer;
          &:first-child {
            margin-right: 6px;
          }
          &:last-child {
            margin-left: 6px;
          }
          &:hover {
            color: var(--main-color);
          }
          // 行内元素不支持 transform，用透明度做按下反馈
          &:active {
            opacity: 0.6;
            transition-duration: var(--press-in);
          }
        }
      }
      .control {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;
        margin-top: 8px;
        .btn {
          padding: 6px;
          margin-bottom: 0;
          .iconfont {
            font-size: 26px;
          }
        }
      }
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 8px;
      transition:
        color 0.3s,
        background-color 0.3s,
        transform var(--press-out) var(--press-ease);
      .iconfont {
        font-size: 20px;
        transition: color 0.3s;
      }
      .share-icon {
        width: 20px;
        height: 20px;
      }
      .name {
        margin-left: 12px;
      }
      &:hover {
        color: var(--main-card-background);
        background-color: var(--main-color);
        .iconfont {
          color: var(--main-card-background);
        }
      }
      &:active {
        color: var(--main-card-background);
        background-color: var(--main-color);
        transform: scale(0.95);
        transition-duration: var(--press-in);
        .iconfont {
          color: var(--main-card-background);
          transition-duration: var(--press-in);
        }
      }
    }
  }
}
.modal-tip {
  font-size: 15px;
  margin-top: -4px;
  margin-bottom: 1rem;
  display: block;
  color: var(--main-font-second-color);
  border-left: 4px solid var(--main-card-border);
  border-radius: 4px;
  padding: 8px 0 8px 12px;
  background-color: var(--main-card-second-background);
}
</style>
