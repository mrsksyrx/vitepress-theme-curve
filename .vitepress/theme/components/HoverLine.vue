<!-- 正文逐行悬停侧边线：鼠标停在哪一行，线就画在哪一行旁边 -->
<template>
  <div ref="lineRef" class="hover-line" :class="{ show: visible }" :style="lineStyle" />
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";

const { hoverLineEnabled } = storeToRefs(mainStore());
const route = useRoute();

// 可定位到文本行的块级元素
const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, pre";
// 线条长度（rem，跟随站点字号设置一起缩放）：固定值，不随被悬停元素的行高变化
const LINE_LENGTH_REM = 2.4;
// 线条到正文左边缘的距离（rem，跟随站点字号设置一起缩放）
const LINE_OFFSET = 1.1;
// 位移动画时长（ms）：近处快、远处略慢，封顶后不会出现长距离「飞行」
const MOVE_BASE_MS = 160;
const MOVE_PER_PX = 0.8;
const MOVE_MAX_MS = 400;
// 取行盒时最多回退试几个最近的候选块
const NEAREST_CANDIDATES = 3;

const visible = ref(false);
const lineStyle = ref({});
const lineRef = ref(null);

let pointer = null;
let frame = null;
let lastKey = "";
let lastTop = null;
let lastDocTop = null;
// 当前这次滑动动画的结束时间与「滑动结束后再贴准一次」的定时器
let slideUntil = 0;
let glueTimer = null;

// 是否显示线条：任何块级元素都显示，只有标题的「#」锚点浮出时让位
// （锚点和线条都在左侧留白里，位置重叠）
const shouldShow = (block) => {
  const anchor = block.querySelector(".header-anchor");
  return !anchor || !block.matches(":hover");
};

// 取离鼠标最近的行矩形：Range 作用于文本节点时，每一行都会返回一个 ClientRect。
// 用「最近」而非「包含」：行与行之间有行距空隙，严格包含会让线条随鼠标上下移动而闪烁
const nearestLineRect = (block, y) => {
  let result = null;
  let minDistance = Infinity;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (!rect.height) continue;
      const distance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      if (distance === 0) return rect;
      if (distance < minDistance) {
        minDistance = distance;
        result = rect;
      }
    }
  }
  return result;
};

const blockDistance = (block, y) => {
  const rect = block.getBoundingClientRect();
  return y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
};

// 找「离鼠标最近、且真的能定位到文本行」的块。
// 指针在段间空白、<hr>、图片、代码块这些地方时命中不到文本块，这里按盒距离挑最近的段落/标题；
// 纯图片段落这类定位不到行的块会被跳过，所以线条不会因为这些元素而消失
const findTarget = (content, y) => {
  const candidates = [];
  for (const block of content.querySelectorAll(BLOCK_SELECTOR)) {
    const distance = blockDistance(block, y);
    if (distance === 0) {
      const rect = nearestLineRect(block, y);
      if (rect) return { block, rect, distance };
      continue;
    }
    candidates.push({ block, distance });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  for (const { block, distance } of candidates.slice(0, NEAREST_CANDIDATES)) {
    const rect = nearestLineRect(block, y);
    if (rect) return { block, rect, distance };
  }
  return null;
};

const hide = () => {
  visible.value = false;
  lastKey = "";
  lastTop = null;
  lastDocTop = null;
  slideUntil = 0;
  if (glueTimer) {
    clearTimeout(glueTimer);
    glueTimer = null;
  }
};

// 滑动进行中先不动位置，等它跑完再按当前坐标贴准一次
const glueAfterSlide = () => {
  if (glueTimer) clearTimeout(glueTimer);
  glueTimer = setTimeout(
    () => {
      glueTimer = null;
      lastKey = "";
      schedule();
    },
    Math.max(0, slideUntil - performance.now()) + 30,
  );
};

// 指针离开文档 / 视口变化 / 路由切换：坐标失效，直接收起
const stop = () => {
  pointer = null;
  hide();
};

const sync = (x, y) => {
  const content = document.querySelector("#page-content");
  // 用坐标反查元素：弹窗遮挡（返回遮罩层）时也能正确收起
  const target = document.elementFromPoint(x, y);
  if (!content || !(target instanceof Element) || !content.contains(target)) return hide();

  const found = findTarget(content, y);
  if (!found) return hide();

  const { block, rect } = found;

  // 先定「显不显示」：标题的「#」锚点浮出时让位。
  // 隐藏期间不更新位置——否则位移发生在不可见状态里，等重新显示时线已经到位，
  // 看上去就是「突然闪现」；冻结位置后，重新显示时这段位移才看得见
  const show = shouldShow(block);
  visible.value = show;
  if (!show) return;

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // 长度取固定值，只跟随站点字号设置缩放：标题行高更大时线条也不会变长
  const height = rootFontSize * LINE_LENGTH_REM;
  const top = rect.top + (rect.height - height) / 2;
  // 用文档坐标判断「还是同一行」：滚动和主题自身的滚动只让整行平移，此时线条直接跟住文字，
  // 不做动画（否则会滞后于文字）；真正换行/换段才滑动，避免硬切
  const docTop = top + window.scrollY;
  const sameLine = lastDocTop !== null && Math.abs(docTop - lastDocTop) < 1;
  let move = 0;
  if (sameLine) {
    // 同一行、只是整体平移：本该瞬时贴住，但正在滑动时先让动画跑完再贴，
    // 否则 0ms 会把这次滑动截断成「闪现」（快速移动时最容易撞上）
    if (performance.now() < slideUntil) return glueAfterSlide();
  } else if (lastDocTop !== null) {
    // 位移时长按上一次目标到本次目标的距离伸缩，跨段落也能滑动而不是硬切
    const moved = Math.abs(top - lastTop);
    move = Math.min(MOVE_MAX_MS, MOVE_BASE_MS + moved * MOVE_PER_PX);
  }
  slideUntil = move > 0 ? performance.now() + move : 0;
  if (lineRef.value) lineRef.value.style.setProperty("--hover-line-move", `${move}ms`);
  lastTop = top;
  lastDocTop = docTop;

  // 基准取正文最外层左边缘：线条始终画在正文留白里，永远在卡片、引用块、列表等容器的外侧，
  // 既不会进入容器，也不会压到容器自带的边框/圆点，并且所有元素共用同一条竖线
  const baseLeft = content.getBoundingClientRect().left;
  lineStyle.value = {
    top: `${top}px`,
    left: `${baseLeft - rootFontSize * LINE_OFFSET}px`,
    height: `${height}px`,
  };
};

// 每帧最多定位一次：鼠标移动与滚动都只登记坐标，真正的测量放在 rAF 里
const schedule = () => {
  if (frame || !pointer) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    const key = `${pointer.x},${pointer.y}`;
    if (key === lastKey) return;
    lastKey = key;
    sync(pointer.x, pointer.y);
  });
};

const onMouseMove = (event) => {
  pointer = { x: event.clientX, y: event.clientY };
  schedule();
};

// 滚动后整段行位置会平移，按鼠标当前坐标重新求行；主题自身也会触发滚动事件，
// 所以这里不能直接隐藏，否则鼠标静止时线条会偶发消失
const onScroll = () => {
  lastKey = "";
  schedule();
};

const bind = (enabled) => {
  if (enabled) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", stop);
    // capture 才能捕获内层滚动容器的滚动
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("mouseleave", stop);
  } else {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", stop);
    window.removeEventListener("scroll", onScroll, { capture: true });
    document.removeEventListener("mouseleave", stop);
    stop();
  }
};

watch(hoverLineEnabled, (enabled) => bind(enabled));
// 路由切换后正文整块被替换，指针不动时线条会停在旧位置
watch(
  () => route.path,
  () => stop(),
);

onMounted(() => bind(hoverLineEnabled.value));

onBeforeUnmount(() => {
  bind(false);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style lang="scss" scoped>
.hover-line {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 0;
  z-index: 20;
  // 圆角取足够大的值，两端形成胶囊头
  border-radius: 9999px;
  background-color: var(--main-color);
  opacity: 0;
  // 位移时长由 JS 按距离写入 --hover-line-move（近处快、远处略慢），显隐一律渐隐
  transition:
    opacity 0.2s,
    top var(--hover-line-move, 0.25s) var(--press-ease),
    left var(--hover-line-move, 0.25s) var(--press-ease),
    height var(--hover-line-move, 0.25s) var(--press-ease);
  pointer-events: none;
  &.show {
    opacity: 1;
  }
}
</style>
