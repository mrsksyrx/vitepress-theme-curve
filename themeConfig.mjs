// 模板主题配置（覆盖默认配置）
// 仅定义需要覆盖的字段，未定义的字段使用默认值
export const themeConfig = {
  // ===== 站点信息 =====
  siteMeta: {
    title: "My Curve Blog",
    description: "一个可直接使用的 VitePress 博客",
    logo: "/images/logo/favicon-256.png",
    site: "https://example.com",
    author: {
      name: "Your Name",
      cover: "/images/logo/favicon-256.png",
      email: "hello@example.com",
      link: "https://example.com",
    },
  },
  // 备案信息（留空则不显示）
  icp: "",
  // 建站日期
  since: "2026-01-01",

  // ===== 页头注入 =====
  inject: {
    header: [
      ["link", { rel: "icon", type: "image/png", href: "/images/logo/favicon-32.png" }],
      ["script", {}, "document.documentElement.classList.add('js-enabled');"],
      [
        "link",
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "RSS",
          href: "/rss.xml",
        },
      ],
      ["link", { rel: "stylesheet", href: "/fonts/iconfont/iconfont.css" }],
    ],
  },

  // ===== 导航栏 =====
  nav: [
    {
      text: "文库",
      items: [
        { text: "文章列表", link: "/pages/archives", icon: "article" },
        { text: "全部分类", link: "/pages/categories", icon: "folder" },
        { text: "全部标签", link: "/pages/tags", icon: "hashtag" },
      ],
    },
    {
      text: "友链",
      items: [
        { text: "友情链接", link: "/pages/link", icon: "people" },
        { text: "畅所欲言", link: "/pages/hide/message", icon: "chat" },
      ],
    },
    {
      text: "我的",
      items: [
        { text: "关于作者", link: "/pages/about-me", icon: "contacts" },
        { text: "关于本站", link: "/pages/about-website", icon: "code" },
        // mobileOnly：只在移动端侧栏显示，不进桌面导航下拉
        {
          text: "回到主页",
          link: "/",
          icon: "home",
          mobileOnly: true,
        },
        {
          text: "服务状态",
          link: "https://status.example.com",
          icon: "chart",
          mobileOnly: true,
        },
      ],
    },
  ],
  navMore: [
    {
      name: "项目",
      list: [
        { icon: "/images/logo/favicon-256.png", name: "My Curve Blog", url: "/" },
        {
          icon: "/images/logo/favicon-256.png",
          name: "示例服务",
          url: "https://service.example.com",
        },
      ],
    },
  ],

  // ===== 页脚 =====
  footer: {
    social: [
      { icon: "email", link: "mailto:hello@example.com" },
      { icon: "qq", link: "https://example.com/qq" },
      { icon: "telegram", link: "https://example.com/telegram" },
      { icon: "twitter-x", link: "https://example.com/twitter" },
      { icon: "github", link: "https://github.com/your-name/your-repository" },
      { icon: "bilibili", link: "https://example.com/bilibili" },
    ],
    sitemap: [
      {
        text: "博客",
        items: [
          { text: "近期文章", link: "/" },
          { text: "全部分类", link: "/pages/categories" },
          { text: "全部标签", link: "/pages/tags" },
          { text: "文章归档", link: "/pages/archives", newTab: true },
        ],
      },
      {
        text: "项目",
        items: [
          { text: "关于本站", link: "/pages/about-website" },
          { text: "示例服务", link: "https://service.example.com", newTab: true },
          { text: "示例项目", link: "https://project.example.com", newTab: true },
          { text: "友情链接", link: "/pages/link" },
        ],
      },
      {
        text: "页面",
        items: [
          { text: "畅所欲言", link: "/pages/hide/message" },
          { text: "扩展页面", link: "/pages/hide/ww-aboutme-sgexilqlsc" },
          { text: "隐私政策", link: "/pages/privacy" },
          { text: "版权协议", link: "/pages/cc" },
          // { text: "TO DO", link: "/pages/todo" },
        ],
      },
      {
        text: "服务",
        items: [
          { text: "站点状态", link: "https://status.example.com", newTab: true },
          { text: "示例服务", link: "https://service.example.com", newTab: true },
          { text: "站点订阅", link: "/rss.xml" },
          { text: "反馈建议", link: "mailto:hello@example.com" },
        ],
      },
    ],
  },

  // ===== 评论 =====
  comment: {
    enable: true,
    type: "twikoo",
    twikoo: {
      js: "https://cdn.jsdelivr.net/npm/twikoo@1.6.42/dist/twikoo.all.min.js",
      envId: "https://twikoo.example.com",
      region: "",
      lang: "zh-CN",
    },
  },

  // ===== 侧边栏 =====
  aside: {
    hello: {
      enable: true,
      text: "欢迎来到<strong>My Curve Blog</strong>w<br>这里会有很多奇奇怪怪的东西哦（x<br>那就，请多指教啦",
    },
    countDown: {
      enable: true,
      data: { name: "生日", date: "2000-01-01" },
    },
    timing: {
      enable: true,
      items: [
        {
          icon: "💌",
          name: "Your Name",
          event: "活着",
          date: "2000-01-01",
          includeStart: true,
        },
      ],
    },
    HelloGithub: {
      enable: true,
    },
  },

  // ===== 功能开关 =====
  rewardData: { enable: false },
  music: {
    enable: true,
    url: "https://meting.example.com/api/meting",
    id: ["1234567890"],
    server: "netease",
    type: "playlist",
  },
  search: {
    enable: true,
    appId: "YOUR_ALGOLIA_APP_ID",
    apiKey: "YOUR_SEARCH_ONLY_API_KEY",
    index: "your_index_pages",
  },
  // 显式空串覆盖上游 51la 统计凭据，防止进包（defu 空对象不删键，必须空串）
  tongji: { "51la": "" },
  // 图片灯箱（点击放大查看）
  fancybox: {
    enable: true,
    js: "https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.umd.min.js",
    css: "https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/fancyapps-ui/5.0.36/fancybox/fancybox.min.css",
  },
  // 外链中转（跳转前显示安全提示页）
  jumpRedirect: {
    enable: true,
  },
};

// 命名导出供 init.mjs 按 userConfig.themeConfig 读取；default 导出
// 满足 import/prefer-default-export，也方便动态导入时按默认值兜底
export default themeConfig;
