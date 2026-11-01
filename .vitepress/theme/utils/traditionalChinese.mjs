// 运行时将页面文字转换为繁体中文。
// 只改 DOM 文本节点和少量可见属性，不修改 Vue 数据源；
// 代码块、输入框、可编辑区域和用户指定的 data-no-translate 区域保持原文。
const SKIP_SELECTOR =
  "script, style, noscript, code, pre, kbd, samp, textarea, input, select, [contenteditable], [data-no-translate]";
const TRANSLATABLE_ATTRIBUTES = ["title", "placeholder", "aria-label"];
const HAN_PATTERN = /[\u3400-\u9fff]/;

let converter = null;
let converterPromise = null;
let observer = null;
let flushFrame = null;
let enabled = false;
let applyVersion = 0;

const translatedNodes = new Set();
const translatedElements = new Set();
const nodeOriginals = new WeakMap();
const nodeConverted = new WeakMap();
const elementAttributeOriginals = new WeakMap();
const elementAttributeConverted = new WeakMap();

const loadConverter = async () => {
  if (!converterPromise) {
    converterPromise = import("opencc-js").then(({ Converter }) =>
      Converter({ from: "cn", to: "twp" }),
    );
  }
  return converterPromise;
};

const isSkipped = (node) => {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return !element || Boolean(element.closest(SKIP_SELECTOR));
};

const convertTextNode = (node) => {
  if (!enabled || !node || node.nodeType !== Node.TEXT_NODE || isSkipped(node)) return;

  const current = node.nodeValue;
  const previousOriginal = nodeOriginals.get(node);
  const previousConverted = nodeConverted.get(node);
  const original =
    translatedNodes.has(node) && previousConverted === current && previousOriginal !== undefined
      ? previousOriginal
      : current;
  if (!original || !HAN_PATTERN.test(original)) {
    translatedNodes.delete(node);
    nodeOriginals.delete(node);
    nodeConverted.delete(node);
    return;
  }

  const converted = converter(original);
  if (converted === original) {
    translatedNodes.delete(node);
    nodeOriginals.delete(node);
    nodeConverted.delete(node);
    return;
  }

  if (current !== converted) node.nodeValue = converted;
  translatedNodes.add(node);
  nodeOriginals.set(node, original);
  nodeConverted.set(node, converted);
};

const convertElementAttributes = (element) => {
  if (!enabled || !element || element.nodeType !== Node.ELEMENT_NODE || isSkipped(element)) return;

  let originalAttributes = elementAttributeOriginals.get(element);
  let convertedAttributes = elementAttributeConverted.get(element);
  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    if (!element.hasAttribute(attribute)) return;
    const current = element.getAttribute(attribute);
    const previousOriginal = originalAttributes?.get(attribute);
    const previousConverted = convertedAttributes?.get(attribute);
    const original =
      translatedElements.has(element) &&
      previousConverted === current &&
      previousOriginal !== undefined
        ? previousOriginal
        : current;
    if (!original || !HAN_PATTERN.test(original)) {
      originalAttributes?.delete(attribute);
      convertedAttributes?.delete(attribute);
      return;
    }

    const converted = converter(original);
    if (converted === original) {
      originalAttributes?.delete(attribute);
      convertedAttributes?.delete(attribute);
      return;
    }

    if (!originalAttributes) {
      originalAttributes = new Map();
      elementAttributeOriginals.set(element, originalAttributes);
    }
    if (!convertedAttributes) {
      convertedAttributes = new Map();
      elementAttributeConverted.set(element, convertedAttributes);
    }
    if (current !== converted) element.setAttribute(attribute, converted);
    originalAttributes.set(attribute, original);
    convertedAttributes.set(attribute, converted);
    translatedElements.add(element);
  });

  if (originalAttributes?.size === 0) {
    elementAttributeOriginals.delete(element);
    elementAttributeConverted.delete(element);
    translatedElements.delete(element);
  }
};

const convertElement = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE || isSkipped(element)) return;

  convertElementAttributes(element);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    convertTextNode(walker.currentNode);
  }
};

const flushMutations = (textNodes, elements) => {
  if (!enabled) return;
  textNodes.forEach(convertTextNode);
  elements.forEach(convertElement);
};

const handleMutations = (mutations) => {
  if (!enabled) return;

  const textNodes = new Set();
  const elements = new Set();
  mutations.forEach((mutation) => {
    if (mutation.type === "characterData") {
      textNodes.add(mutation.target);
      return;
    }
    if (mutation.type === "attributes") {
      elements.add(mutation.target);
      return;
    }
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) textNodes.add(node);
      else if (node.nodeType === Node.ELEMENT_NODE) elements.add(node);
    });
  });

  if (textNodes.size === 0 && elements.size === 0) return;
  if (flushFrame !== null) return;
  flushFrame = requestAnimationFrame(() => {
    flushFrame = null;
    flushMutations(textNodes, elements);
  });
};

const startObserver = () => {
  if (observer) return;
  observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRIBUTES,
  });
};

const restoreOriginals = () => {
  translatedNodes.forEach((node) => {
    const original = nodeOriginals.get(node);
    if (original !== undefined && node.nodeValue !== original) node.nodeValue = original;
    nodeOriginals.delete(node);
    nodeConverted.delete(node);
  });
  translatedNodes.clear();

  translatedElements.forEach((element) => {
    const originalAttributes = elementAttributeOriginals.get(element);
    originalAttributes?.forEach((original, attribute) => {
      if (element.getAttribute(attribute) !== original) element.setAttribute(attribute, original);
    });
    elementAttributeOriginals.delete(element);
    elementAttributeConverted.delete(element);
  });
  translatedElements.clear();
};

const stop = () => {
  enabled = false;
  if (flushFrame !== null) {
    cancelAnimationFrame(flushFrame);
    flushFrame = null;
  }
  observer?.disconnect();
  observer = null;
  restoreOriginals();
};

/**
 * 开启或关闭页面繁体中文转换。
 * 该函数只应在客户端调用，并由根布局根据持久化的设置状态触发。
 */
export const applyTraditionalChinese = async (nextEnabled) => {
  if (typeof window === "undefined") return;

  const currentVersion = ++applyVersion;
  if (!nextEnabled) {
    stop();
    return;
  }
  if (enabled) return;

  try {
    const nextConverter = await loadConverter();
    if (currentVersion !== applyVersion || !nextEnabled) return;

    converter = nextConverter;
    enabled = true;
    convertElement(document.documentElement);
    startObserver();
  } catch (error) {
    enabled = false;
    console.error("繁体中文转换初始化失败：", error);
  }
};
