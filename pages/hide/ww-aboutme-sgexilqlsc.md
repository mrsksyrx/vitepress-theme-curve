---
title: 扩展页面示例
date: 2026-01-01
categories: [示例]
tags: [模板]
description: 演示一个不进入主导航的扩展页面。
top: false
layout: post
---

# 扩展页面示例

这个页面展示了如何创建一个不直接出现在主导航中的专属页面。

你可以把二维码、活动说明、项目文档或临时公告放在类似路径中，再通过短链接或二维码分发。

## 页面路径

当前路径为 `/pages/hide/example`。建议新建项目后把它改成更有语义的路径，例如：

```text
/pages/hide/event-checkin
```

如果需要让移动端返回按钮固定回到首页，可以修改 `.vitepress/theme/components/Nav.vue` 中的入口页面判断逻辑。
