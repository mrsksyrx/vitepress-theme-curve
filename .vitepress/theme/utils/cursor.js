import { isEqual } from "lodash-es";

let mainCursor;

const lerp = (a, b, n) => {
  if (Math.round(a) === b) {
    return b;
  }
  return (1 - n) * a + n * b;
};

const cursorInit = () => {
  // 确保只在客户端初始化光标
  if (typeof window !== "undefined") {
    mainCursor = new Cursor();
    return mainCursor;
  }
  return null; // 在非浏览器环境下返回 null
};

class Cursor {
  constructor() {
    this.pos = {
      curr: null,
      prev: null,
    };
    this.currentThemeType = "auto";
    this.rafId = null;

    // 稳定的 handler 引用：refresh()/destroy() 需用同一引用精确解绑
    this.handleMouseMove = (e) => {
      this.pos.curr == null && this.move(e.clientX - 8, e.clientY - 8);
      this.pos.curr = {
        x: e.clientX - 8,
        y: e.clientY - 8,
      };
      this.cursor.classList.remove("hidden");
      this.render();
    };
    this.handleMouseEnter = () => this.cursor.classList.remove("hidden");
    this.handleMouseLeave = () => this.cursor.classList.add("hidden");
    this.handleMouseDown = () => this.cursor.classList.add("active");
    this.handleMouseUp = () => this.cursor.classList.remove("active");

    // 所有 DOM 操作和事件绑定都在 create/init 中处理，这些方法会包含环境检查
    this.create();
    this.init();
    this.render();
  }

  move(left, top) {
    if (this.cursor) {
      // 确保 this.cursor 存在
      this.cursor.style["left"] = `${left}px`;
      this.cursor.style["top"] = `${top}px`;
    }
  }

  create() {
    // 确保只在客户端创建 DOM 元素
    if (typeof document === "undefined") return;

    if (!this.cursor) {
      this.cursor = document.createElement("div");
      this.cursor.id = "cursor";
      this.cursor.classList.add("xs-hidden");
      this.cursor.classList.add("hidden");
      document.body.append(this.cursor);
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    if (isMobile) {
      this.cursor.classList.add("hidden");
      if (this.scr) {
        this.scr.remove();
      }
      document.body.style.cursor = "auto";
      return;
    }

    if (!this.scr) {
      document.body.appendChild((this.scr = document.createElement("style")));
    }
  }

  updateCursorStyle(themeType, themeColor = "pink") {
    if (typeof window === "undefined" || !this.scr) return;

    const cursorColorMap = {
      light: {
        pink: "%23e8558e",
        purple: "%238000ff",
        blue: "%234fc3f7",
        red: "%23ef5350",
        green: "%2366bb6a",
        gray: "%239e9e9e",
      },
      dark: {
        pink: "%23f06292",
        purple: "%23b388ff",
        blue: "%2381d4fa",
        red: "%23ef9a9a",
        green: "%23a5d6a7",
        gray: "%23757575",
      },
    };

    let actualTheme;
    if (themeType === "auto") {
      actualTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      actualTheme = themeType;
    }

    const cursorColor = cursorColorMap[actualTheme][themeColor] || cursorColorMap[actualTheme].pink;
    this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='${cursorColor}' /></svg>") 4 4, auto !important}`;
  }

  setThemeType(newThemeType, themeColor = "pink") {
    this.currentThemeType = newThemeType;
    this.currentThemeColor = themeColor;
    if (
      typeof window !== "undefined" &&
      this.cursor &&
      !/Mobi|Android/i.test(navigator.userAgent)
    ) {
      this.updateCursorStyle(newThemeType, themeColor);
    }
  }

  setCursorColor(hexColor) {
    if (typeof window === "undefined" || !this.scr) return;
    // 白名单校验：只接受 3-8 位十六进制色值，防止拼进 innerHTML 的 CSS 注入
    if (typeof hexColor !== "string" || !/^#?[0-9a-fA-F]{3,8}$/.test(hexColor)) {
      hexColor = "#e8558e";
    }
    const encoded = hexColor.replaceAll("#", "%23");
    this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='${encoded}' /></svg>") 4 4, auto !important}`;
  }

  enable() {
    if (typeof document === "undefined" || !this.cursor) return;
    this.cursor.classList.remove("disabled");
    if (this.scr) {
      this.scr.sheet.disabled = false;
    }
  }

  disable() {
    if (typeof document === "undefined" || !this.cursor) return;
    this.cursor.classList.add("disabled");
    if (this.scr) {
      this.scr.sheet.disabled = true;
    }
  }

  cancelRender() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  unbindEvents() {
    if (typeof document === "undefined") return;
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseenter", this.handleMouseEnter);
    document.removeEventListener("mouseleave", this.handleMouseLeave);
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  destroy() {
    this.cancelRender();
    if (typeof document === "undefined") return;

    this.unbindEvents();
    this.cursor?.remove();
    this.scr?.remove();
    this.cursor = null;
    this.scr = null;
  }

  refresh() {
    if (typeof document === "undefined") return; // 确保在客户端

    // 重跑 create/init/render 前必须掐掉旧 RAF，否则多条渲染循环叠加
    this.cancelRender();

    // 移动端在 init() 里会提前 return，this.scr 可能尚未创建；
    // 桌面端则必须先置空，否则 create() 里的 `if (!this.scr)` 为假，
    // 被 remove() 掉的 <style> 不会重新挂回，自定义光标样式永久失效。
    this.scr?.remove();
    this.scr = null;
    this.cursor?.classList.remove("active");
    this.pos = {
      curr: null,
      prev: null,
    };

    this.create();
    this.init();
    this.render();
  }

  init() {
    if (typeof document === "undefined") return; // 确保在客户端

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      return;
    }

    // 先摘掉旧监听，保证 refresh() 重复 init 时不会叠加
    this.unbindEvents();
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseenter", this.handleMouseEnter);
    document.addEventListener("mouseleave", this.handleMouseLeave);
    document.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  render() {
    if (typeof document === "undefined") return; // 确保在客户端

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
      return;
    }

    if (this.pos.prev) {
      this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, 0.35);
      this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, 0.35);
      this.move(this.pos.prev.x, this.pos.prev.y);
    } else {
      this.pos.prev = this.pos.curr;
    }
    // 仅在收敛未完成且没有待执行帧时续期，保证同一时刻只有一条 RAF 链
    if (!isEqual(this.pos.curr, this.pos.prev) && this.rafId == null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.render();
      });
    }
  }
}

export default cursorInit;
