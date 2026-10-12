<!-- 文章密码保护组件 -->
<template>
  <div class="password-protect s-card">
    <div class="protect-icon">
      <span class="lock-emoji">🔒</span>
    </div>
    <h3 class="protect-title">此文章已加密</h3>
    <p class="protect-desc">请输入密码以查看完整内容</p>
    <div class="protect-input-wrapper">
      <input
        v-model="inputPassword"
        type="password"
        class="protect-input"
        placeholder="请输入密码"
        @keyup.enter="verifyPassword"
      />
      <button class="protect-btn" :disabled="verifying" @click="verifyPassword">解锁</button>
    </div>
    <p v-if="errorMessage" class="protect-error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { unlockPost, decryptWithKey } from "@/utils/decryptPost.mjs";

const props = defineProps({
  // 旧版明文密码（未走构建期加密时的兜底）
  password: {
    type: [String, Number],
    default: "",
  },
  // 构建期加密的密文
  enc: {
    type: Object,
    default: null,
  },
  postId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["unlocked"]);

const inputPassword = ref("");
const errorMessage = ref("");
const verifying = ref(false);

// localStorage 读写（损坏时降级为空对象，不抛异常）
const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem("unlockedPosts") || "{}");
  } catch {
    return {};
  }
};
const writeStore = (store) => {
  try {
    localStorage.setItem("unlockedPosts", JSON.stringify(store));
  } catch {
    // 存储不可用时仅本次会话有效
  }
};

// 已保存的密钥匹配当前密文时直接解密（跳过 PBKDF2）
const tryStoredKey = async () => {
  const entry = readStore()[props.postId];
  if (!entry || typeof entry !== "object" || entry.salt !== props.enc.salt || !entry.key)
    return false;
  try {
    emit("unlocked", await decryptWithKey(entry.key, props.enc));
    return true;
  } catch {
    // 密钥失效（内容已更新等），清除后要求重新输入
    const store = readStore();
    delete store[props.postId];
    writeStore(store);
    return false;
  }
};

// 验证密码：加密文章以 AES-GCM 解密成功与否作为校验，失败即密码错误
const verifyPassword = async () => {
  if (verifying.value) return;
  errorMessage.value = "";
  if (props.enc) {
    verifying.value = true;
    try {
      const { html, key } = await unlockPost(inputPassword.value, props.enc);
      const store = readStore();
      store[props.postId] = { salt: props.enc.salt, key };
      writeStore(store);
      emit("unlocked", html);
    } catch {
      errorMessage.value = "密码错误，请重试";
      inputPassword.value = "";
    } finally {
      verifying.value = false;
    }
    return;
  }
  // 旧版明文密码
  if (inputPassword.value === String(props.password)) {
    const store = readStore();
    store[props.postId] = true;
    writeStore(store);
    emit("unlocked");
  } else {
    errorMessage.value = "密码错误，请重试";
    inputPassword.value = "";
  }
};

// 组件挂载时检查是否已解锁
onMounted(async () => {
  if (props.enc) {
    await tryStoredKey();
  } else if (readStore()[props.postId] === true) {
    emit("unlocked");
  }
});
</script>

<style lang="scss" scoped>
.password-protect {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 3rem;
  margin: 0 auto;
  max-width: 600px;
  width: 100%;
  text-align: center;

  .protect-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--main-color-bg);
    margin-bottom: 1rem;

    .lock-emoji {
      font-size: 28px;
    }
  }

  .protect-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--main-font-color);
    margin-bottom: 0.4rem;
  }

  .protect-desc {
    font-size: 0.85rem;
    color: var(--main-font-second-color);
    margin-bottom: 1rem;
  }

  .protect-input-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 360px;

    .protect-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid var(--main-card-border);
      border-radius: 12px;
      background: var(--main-card-background);
      color: var(--main-font-color);
      font-size: 1rem;
      outline: none;
      transition: border-color 0.3s;

      &::placeholder {
        color: var(--main-font-second-color);
      }

      &:focus {
        border-color: var(--main-color);
      }
    }

    .protect-btn {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding: 12px 20px;
      border: none;
      border-radius: 12px;
      background: var(--main-color);
      color: #fff;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition:
        opacity 0.3s,
        transform 0.2s;

      &:hover {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: wait;
      }

      &:active {
        transform: scale(0.98);
        transition-duration: var(--press-in);
      }
    }
  }

  .protect-error {
    margin-top: 1rem;
    color: var(--main-error-color);
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;

    .protect-input-wrapper {
      flex-direction: column;
      gap: 12px;

      .protect-input,
      .protect-btn {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
