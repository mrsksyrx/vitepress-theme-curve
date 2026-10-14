<template>
  <Teleport to="body">
    <Transition name="fade" mode="out-in">
      <div v-if="loadingStatus" class="loading" @click="loadingStatus = false">
        <img :src="theme.siteMeta.logo" class="logo" alt="loading-logo" />
        <div class="progress-bar">
          <div class="progress-fill" />
        </div>
        <span :class="['tip', { show: showTip }]"> 一直显示？点击任意区域即可关闭 </span>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";

const store = mainStore();
const { theme } = useData();
const { loadingStatus } = storeToRefs(store);

// 显示提示
const showTip = ref(false);
const showTimeOut = ref(null);

// 监听加载状态
watch(
  () => loadingStatus.value,
  (val) => {
    if (val) {
      showTimeOut.value = setTimeout(() => {
        showTip.value = true;
      }, 3000);
    } else {
      showTip.value = false;
      clearTimeout(showTimeOut.value);
    }
  },
);

onBeforeUnmount(() => {
  clearTimeout(showTimeOut.value);
});
</script>

<style lang="scss" scoped>
.loading {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: var(--main-card-background);
  z-index: 9999;
  .logo {
    width: 100px;
    height: 100px;
    animation: loading 2s infinite;
  }
  .progress-bar {
    width: 160px;
    height: 5px;
    margin-top: 20px;
    border-radius: 2px;
    background-color: var(--main-card-second-background);
    overflow: hidden;
    .progress-fill {
      width: 0;
      height: 100%;
      border-radius: 2px;
      background-color: var(--main-color);
      animation: progress 2s ease-out forwards;
    }
  }
  .tip {
    position: absolute;
    bottom: 2rem;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
    &.show {
      opacity: 0.6;
    }
  }
}

@keyframes progress {
  0% {
    width: 0%;
  }
  20% {
    width: 30%;
  }
  50% {
    width: 60%;
  }
  80% {
    width: 85%;
  }
  100% {
    width: 100%;
  }
}
</style>
