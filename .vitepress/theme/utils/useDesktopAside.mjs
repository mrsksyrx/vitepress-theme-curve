import { onBeforeUnmount, onMounted, ref } from "vue";

const ASIDE_MEDIA_QUERY = "(min-width: 769px)";

export const useDesktopAside = () => {
  const isDesktopAsideVisible = ref(false);
  let mediaQueryList;
  let observer = null;

  const updateAsideVisibility = () => {
    const isForceMobile = document.documentElement.classList.contains("force-mobile");
    isDesktopAsideVisible.value = !isForceMobile && Boolean(mediaQueryList?.matches);
  };

  onMounted(() => {
    if (typeof window === "undefined") return;

    mediaQueryList = window.matchMedia(ASIDE_MEDIA_QUERY);
    updateAsideVisibility();

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", updateAsideVisibility);
    } else {
      mediaQueryList.addListener(updateAsideVisibility);
    }

    // 监听 html class 变化（force-mobile 切换）
    observer = new MutationObserver(updateAsideVisibility);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });

  onBeforeUnmount(() => {
    if (mediaQueryList) {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", updateAsideVisibility);
      } else {
        mediaQueryList.removeListener(updateAsideVisibility);
      }
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    isDesktopAsideVisible,
  };
};
