/**
 * 折叠卡片展开/收起动画
 *
 * <details> 保留原生行为作为无 JavaScript 降级；客户端挂载后捕获标题点击，
 * 通过 CSS Grid 0fr -> 1fr 的过渡实现平滑开合，不在点击线程同步测量高度。
 */
const COLLAPSE_SELECTOR = "details.collapse-card";
const CONTENT_SELECTOR = ":scope > .collapse-card-content";
const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, [role='button']";

const animatedCards = new WeakMap();
let clickHandler = null;

const parseTime = (value) => {
  const time = value.trim().toLowerCase();
  if (time.endsWith("ms")) return Number.parseFloat(time);
  if (time.endsWith("s")) return Number.parseFloat(time) * 1000;
  return 0;
};

const getTransitionDuration = (element) => {
  const styles = getComputedStyle(element);
  const duration = parseTime(styles.transitionDuration.split(",")[0] || "0s");
  const delay = parseTime(styles.transitionDelay.split(",")[0] || "0s");
  return Math.max(0, duration + delay);
};

const finishAnimation = (details, open, state) => {
  if (animatedCards.get(details) !== state) return;
  clearTimeout(state.timer);
  animatedCards.delete(details);
  delete details.dataset.collapseState;
  if (!open) details.open = false;
};

const animateCard = (details, open) => {
  const content = details.querySelector(CONTENT_SELECTOR);
  if (!content) {
    details.open = open;
    return;
  }

  const previousState = animatedCards.get(details);
  if (previousState) {
    cancelAnimationFrame(previousState.frame);
    clearTimeout(previousState.timer);
  }

  const state = { frame: 0, timer: 0 };
  animatedCards.set(details, state);

  if (open) {
    details.open = true;
    details.dataset.collapseState = "measuring";
    // 双 rAF：先让浏览器以收起状态完成一次布局/绘制，下一帧再切换到 opening，
    // 避免 <details> 从 display:none 打开时丢失首个过渡帧。
    state.frame = requestAnimationFrame(() => {
      if (animatedCards.get(details) !== state) return;
      state.frame = requestAnimationFrame(() => {
        if (animatedCards.get(details) !== state) return;
        details.dataset.collapseState = "opening";
        state.timer = window.setTimeout(
          () => {
            finishAnimation(details, true, state);
          },
          getTransitionDuration(content) + 60,
        );
      });
    });
    return;
  }

  details.dataset.collapseState = "closing";
  state.timer = window.setTimeout(
    () => {
      finishAnimation(details, false, state);
    },
    getTransitionDuration(content) + 60,
  );
};

const handleSummaryClick = (event) => {
  const summary = event.target.closest?.(`${COLLAPSE_SELECTOR} > summary`);
  if (!summary) return;
  if (event.target.closest?.(INTERACTIVE_SELECTOR)) return;

  const details = summary.parentElement;
  if (!details?.matches(COLLAPSE_SELECTOR)) return;

  event.preventDefault();
  const open =
    details.dataset.collapseState === "closing" ||
    (details.dataset.collapseState !== "opening" &&
      details.dataset.collapseState !== "measuring" &&
      !details.open);
  animateCard(details, open);
};

const initCollapseCards = () => {
  if (typeof document === "undefined" || clickHandler) return () => {};
  clickHandler = handleSummaryClick;
  document.addEventListener("click", clickHandler);
  return () => {
    if (!clickHandler) return;
    document.removeEventListener("click", clickHandler);
    clickHandler = null;
  };
};

export default initCollapseCards;
