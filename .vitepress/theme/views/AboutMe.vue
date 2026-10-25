<template>
  <div class="about">
    <h1 class="title">关于作者</h1>
    <div class="about-content about-grid">
      <!-- Row 1 -->
      <div class="about-item hello" style="grid-column: 1 / 3; grid-row: 1">
        <span class="text1">初次见面，请多指教~</span>
        <span class="text2 title2">我是 Your Name</span>
        <span class="text3">一个热爱技术、写作与创作的人</span>
      </div>

      <div class="about-item skills" style="grid-column: 3; grid-row: 1">
        <span class="tip">兴趣</span>
        <div class="skills-list">
          <span class="skills-item tag-pink"
            ><span class="tag-blue">开发</span
            ><span class="tag-pink-text tag-bold">·创作</span></span
          >
          <span class="skills-item tag-pink">阅读</span>
          <span class="skills-item tag-pink">摄影</span>
          <span class="skills-item">音乐</span>
          <span class="skills-item">电影</span>
          <span class="skills-item">设计</span>
          <span class="skills-item">游戏</span>
          <span class="skills-item">写作</span>
        </div>
      </div>

      <!-- Row 2 -->
      <div class="about-item card-mbti" style="grid-column: 1; grid-row: 2">
        <div class="mbti-type">
          <span class="mbti-blue">MB</span><span class="mbti-pink">TI</span>
        </div>
      </div>

      <div class="about-item card-3" style="grid-column: 2; grid-row: 2">
        <span class="tip">我在</span>
        <span class="title2"
          ><strong style="color: var(--about-blue)">你的城市</strong>&<strong
            style="color: var(--about-accent)"
            >你的城市</strong
          ></span
        >
      </div>

      <div class="about-item card-5" style="grid-column: 3; grid-row: 2">
        <div class="info">
          <div class="info-item">
            <span class="info-name">出生年份</span>
            <span class="info-num" style="--color: var(--about-blue)">2000</span>
          </div>
          <div class="info-item">
            <span class="info-name">生日</span>
            <span class="info-num" style="--color: var(--about-accent)">01-01</span>
          </div>
          <div class="info-item">
            <span class="info-name">距生日</span>
            <span class="info-num" style="--color: var(--about-blue)">
              <LiveDate mode="days-until" :date="birthDate" yearly />
            </span>
          </div>
        </div>
      </div>

      <!-- Row 3 -->
      <div class="about-item" style="grid-column: 1 / 4; grid-row: 3">
        <p
          class="text"
          style="
            margin: 0;
            font-size: 1.5rem;
            line-height: 1.5;
            color: var(--about-accent);
            font-weight: bold;
          "
        >
          保持好奇，持续学习，也别忘了记录生活。
        </p>
      </div>

      <!-- Row 4 -->
      <div class="about-item card-4" style="grid-column: 1 / 4; grid-row: 4">
        <div class="hrt-nodes" style="font-size: 18px">
          <p class="text">
            完成第一个项目：<span style="color: var(--about-accent)">2024.09.01</span>
          </p>
          <p class="text">
            开始系统学习：<span style="color: var(--about-accent)">2025.03.01</span>
          </p>
          <p class="text">
            持续练习：<span style="color: var(--about-accent)">2025.06.01 - 2025.08.01</span>
          </p>
          <p class="text" style="margin-bottom: 1em">
            开始长期创作：<span style="color: var(--about-accent)">2026.01.01</span>
          </p>
        </div>
        <span class="tip"
          >持续学习与创作<br />已经
          <span class="tag-pink-text"
            ><LiveDate mode="days-since" :date="milestoneStartDate"
          /></span>
          天</span
        >
      </div>

      <!-- Row 5 -->
      <div class="about-item" style="grid-column: 1 / 4; grid-row: 5">
        <span class="title2">个人介绍</span>
        <div class="intro-content">
          <p>昵称：Your Name，欢迎从这里开始了解我。</p>
          <p>职业：在这里填写你的职业、专业或正在学习的方向。</p>
          <p>兴趣：开发、阅读、摄影、音乐、电影、设计、游戏或写作。</p>
          <p>生日：2000-01-01，坐标：你的城市。</p>
          <p>我关注技术、创意和日常生活，也喜欢把学到的东西整理成文章。</p>
          <p>这里可以放你的作品、项目、技能或长期重点内容。</p>
          <p>联系方式：hello@example.com。</p>
          <p>你可以根据自己的情况修改这一段，不需要照搬模板示例。</p>
          <p>介绍内容建议保持真实、简洁，并定期更新。</p>
        </div>
        <p style="font-size: 12px; opacity: 0.5; margin-top: 12px; margin-bottom: 0">
          最后更新于 2026.10.9
        </p>
      </div>

      <!-- Row 6 -->
      <div class="about-item" style="grid-column: 1 / 4; grid-row: 6">
        <span class="title2">简短介绍</span>
        <div class="intro-content">
          <p>Your Name｜技术与生活记录</p>
          <p>正在学习前端、写作与产品设计</p>
          <p>喜欢清晰的结构、可靠的工具和长期主义</p>
          <p>欢迎交流，也欢迎通过留言板留下建议</p>
          <p>这里可以替换成你的社交平台简介</p>
        </div>
        <p style="font-size: 12px; opacity: 0.5; margin-top: 12px; margin-bottom: 0">
          最后更新于 2026.01.01
        </p>
      </div>
    </div>

    <!-- Row 7 起：瀑布流 -->
    <div class="about-content about-waterfall">
      <div class="about-item">
        <div class="intro-content">
          <p>这里填写卡片一的内容。</p>
          <p>这里填写补充说明。</p>
          <p>这里填写重点内容。</p>
          <p>这里填写其他信息。</p>
          <p>这里填写总结。</p>
        </div>
      </div>
      <div class="about-item">
        <p class="text">这里填写卡片二的内容。</p>
        <p class="text">这里填写第一段介绍。</p>
        <p class="text">这里填写第二段介绍。</p>
        <p class="text">这里填写第三段介绍。</p>
      </div>
      <div class="about-item">
        <p class="text">这里填写卡片三的内容。</p>
        <p class="text">这里填写补充说明或总结。</p>
      </div>
      <div class="about-item">
        <p class="text">这里填写卡片四的内容。</p>
        <p class="text">这里填写补充说明。</p>
        <p class="text">这里填写强调内容。</p>
      </div>
      <div class="about-item">
        <p class="text">这里填写内容一</p>
        <p class="text">这里填写内容二</p>
        <p class="text">这里填写内容三</p>
        <p class="text">这里填写内容四</p>
        <p class="text">这里填写内容五</p>
        <p class="text">这里填写内容六</p>
        <p class="text">——署名</p>
      </div>
      <div class="about-item">
        <p class="text">相关链接</p>
        <div class="card-action">
          <a href="#" class="view-btn">示例链接一</a>
          <a href="#" class="view-btn">示例链接二</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const birthDate = "2000-01-01";
// 里程碑日期；天数走 LiveDate（days-since），由 useClientNow 在浏览器端计算
const milestoneStartDate = "2026-01-01";
</script>

<style lang="scss" scoped>
.about {
  --about-card-bg: #ffffff;
  --about-card-border: #e5e7eb;
  --about-shadow: rgba(0, 0, 0, 0.08);
  --about-text: #1f2937;
  --about-text-secondary: #6b7280;
  --about-accent: #f472b6;
  --about-blue: #60a5fa;
  --about-tag-bg: #f9fafb;
  --about-tag-bg-hover: #ffffff;
  color-scheme: light dark;
}

html.dark .about {
  --about-card-bg: #1e1e2e;
  --about-card-border: #313244;
  --about-shadow: rgba(0, 0, 0, 0.3);
  --about-text: #f5f5f5;
  --about-text-secondary: #a1a1aa;
  --about-accent: #f472b6;
  --about-blue: #60a5fa;
  --about-tag-bg: #2a2a3e;
  --about-tag-bg-hover: #1e1e2e;

  .about-item.hello {
    background-image: linear-gradient(120deg, #1a3a5c 0%, #2a1f2e 50%, #4a1a35 100%);
  }
}

.about {
  .title {
    font-size: 2.4rem;
    text-align: center;
    border: none;
    padding-bottom: 0;
    color: var(--about-text);
  }
  .about-content {
    display: grid;
    grid-template-columns: auto auto;
    gap: 20px;
    margin-bottom: 20px;
    .about-item {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      padding: 1.2rem 2rem;
      border-radius: 12px;
      background-color: var(--about-card-bg);
      border: 1px solid var(--about-card-border);
      box-shadow: 0 8px 12px -4px var(--about-shadow);
      overflow: hidden;
      color: var(--about-text);
      .tip {
        font-size: 14px;
        opacity: 0.8;
        margin-bottom: 12px;
        color: var(--about-text);
      }
      .title1 {
        font-size: 36px;
        font-weight: bold;
        opacity: 0.6;
        color: var(--about-text);
      }
      .title2 {
        font-size: 36px;
        font-weight: bold;
        margin-right: 4rem;
        color: var(--about-text);
      }
      &.card-3 {
        .title2 {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px 8px;
          margin-right: 0;
        }
      }
      .text {
        font-size: 18px;
        margin: 4px 0;
        color: var(--about-text);
      }
      .card-action {
        margin-top: auto;
        padding-top: 4px;
        display: flex;
        justify-content: flex-start;
        gap: 8px;
        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9375rem;
          border-radius: 8px;
          padding: 6px 8px;
          min-width: 30px;
          color: var(--about-card-bg);
          background-color: var(--about-accent);
          transition:
            box-shadow var(--press-out) var(--press-ease),
            transform var(--press-out) var(--press-ease);
          text-decoration: none;
          &:hover {
            box-shadow: 0 8px 16px -4px var(--about-shadow);
          }
          &:active {
            box-shadow: 0 8px 16px -4px var(--about-shadow);
            transform: scale(0.95);
            transition-duration: var(--press-in);
          }
        }
      }
      &.child {
        background-color: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        gap: 20px;
        .about-item {
          height: 100%;
        }
      }
      &.hello {
        justify-content: center;
        padding: 2rem;
        color: #fff;
        background-image: linear-gradient(120deg, #64b5f6 0%, #f0e4ea 50%, #e8558e 100%);
        background-size: 200% 200%;
        animation: gradientFlow 6s ease infinite;
        .title2 {
          line-height: 2;
          color: #fff;
        }
        .text4 {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }
      }
      &.pursuit {
        .title2 {
          line-height: 1.2;
          &:last-child {
            display: inline-block;
            background-size: 100% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-repeat: no-repeat;
            background-image: linear-gradient(45deg, #fa7671 50%, #f45f7f);
          }
        }
      }
      &.character {
        min-height: 220px;
        cursor: pointer;
        .more {
          margin-top: auto;
          font-size: 14px;
          color: var(--about-text-secondary);
          a {
            color: var(--about-text-secondary);
            &:hover {
              color: var(--about-accent);
            }
          }
        }
        .male {
          position: absolute;
          top: 20px;
          right: -10px;
          height: 140%;
          width: auto;
          transition: transform 0.5s;
          transform-origin: top center;
          @media (max-width: 768px) {
            height: 80%;
          }
        }
        &:hover {
          .male {
            transform: scale(1.2);
          }
        }
      }
      &.skills {
        .tip {
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--about-text);
        }
        .skills-list {
          margin-top: 12px;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 10px;
          .skills-item {
            padding: 8px 16px;
            border-radius: 50px;
            background: var(--about-tag-bg);
            border: 1px solid var(--about-card-border);
            font-weight: bold;
            font-size: 0.95rem;
            color: var(--about-text);
            &.tag-pink {
              color: var(--about-accent);
              border-color: #f472b640;
            }
            .tag-blue {
              color: var(--about-blue);
            }
            .tag-pink-text {
              color: var(--about-accent);
              &.tag-bold {
                font-weight: bold;
              }
            }
          }
        }
      }
      &.career {
        .title2 {
          letter-spacing: 0.2rem;
          font-size: 40px;
          color: var(--about-text);
        }
        .list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          .list-item {
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-bottom: 12px;
            color: var(--about-text-secondary);
            &::before {
              content: "";
              display: block;
              width: 16px;
              height: 16px;
              background-color: var(--color);
              border-radius: 50%;
              margin-right: 8px;
            }
          }
        }
        .career-img {
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          @media (max-width: 768px) {
            position: static;
          }
        }
      }
      &.game {
        min-height: 300px;
        @media (max-width: 768px) {
          min-height: 240px;
        }
      }
      &.like {
        min-height: 400px;
        @media (max-width: 768px) {
          min-height: 300px;
        }
      }
      &.image {
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        .image-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          z-index: 2;
          color: var(--about-text);
          .image-desc {
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-top: auto;
            &.opacity {
              font-size: 14px;
              color: var(--about-text-secondary);
              opacity: 0.8;
              a {
                color: var(--about-text-secondary);
                &:hover {
                  color: var(--about-accent);
                }
              }
            }
          }
        }
        &::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          box-shadow: none;
          z-index: 0;
        }
      }
      &.map {
        min-height: 170px;
        background-size: 100%;
        transition: background 1.5s ease-in-out;
        cursor: pointer;
        @media (max-width: 768px) {
          background-size: cover;
          pointer-events: none;
        }
        .position {
          display: block;
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          padding: 20px 30px;
          color: #fff;
          background-color: #636352;
          font-size: 20px;
          transition: bottom 1s;
        }
        &:hover {
          background-size: 120%;
          background-position-x: 0;
          background-position-y: 36%;
          .position {
            bottom: -80px;
          }
        }
      }
      &.info {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
        gap: 1.25rem 2rem;
        .info-item {
          display: flex;
          flex-direction: column;
          min-width: 0;
          .info-name {
            font-size: 14px;
            margin-bottom: 8px;
            color: var(--about-text-secondary);
          }
          .info-num {
            font-size: 34px;
            font-weight: bold;
            color: var(--about-accent);
          }
        }
      }
    }
    .intro-content {
      margin-top: 12px;
      p {
        font-size: 1rem;
        margin: 4px 0;
        color: var(--about-text);
      }
    }
    &.about-grid {
      grid-template-columns: 0.8fr 1.2fr 1.2fr;
      grid-template-rows: auto auto auto;
      .card-4 {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        .tip {
          font-size: 24px;
          font-weight: bold;
          color: var(--about-text);
          opacity: 1;
          .tag-pink-text {
            color: var(--about-accent);
          }
        }
      }
      .card-mbti {
        justify-content: center;
        align-items: flex-start;
      }
      .mbti-type {
        font-size: 2.6rem;
        font-weight: bold;
        letter-spacing: 2px;
        .mbti-blue {
          color: var(--about-blue);
        }
        .mbti-pink {
          color: var(--about-accent);
        }
      }
      .info {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
        gap: 1.25rem 2rem;
        .info-item {
          display: flex;
          flex-direction: column;
          min-width: 0;
          .info-name {
            font-size: 14px;
            margin-bottom: 8px;
            color: var(--about-text-secondary);
          }
          .info-num {
            font-size: 34px;
            font-weight: bold;
            color: var(--about-accent);
          }
        }
      }
      .timeline {
        margin-top: 8px;
        p {
          font-size: 0.9rem;
          margin: 6px 0;
          opacity: 0.85;
          color: var(--about-text);
        }
      }
    }
    &.about-waterfall {
      display: block;
      columns: 2;
      column-gap: 20px;

      > .about-item {
        break-inside: avoid;
        margin-bottom: 20px;
      }
    }
    &:last-child {
      margin-bottom: 0;
    }
    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;

      &.about-waterfall {
        display: block;
        columns: 1;
      }

      .about-item {
        padding: 1.2rem 1.25rem;

        .title1 {
          font-size: 2rem;
        }

        .title2 {
          font-size: clamp(1.5rem, 8vw, 2rem);
          margin-right: 0;
          overflow-wrap: anywhere;
        }

        .text {
          font-size: 1rem;
        }

        &.info .info-item .info-num {
          font-size: 1.75rem;
        }

        &.card-3 .title2 {
          font-size: clamp(1.6rem, 8vw, 2rem);
        }

        &.map .position {
          padding: 1rem 1.25rem;
          font-size: 1rem;
        }

        &.info {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem 1rem;

          .info-item {
            margin-right: 0;
          }
        }
      }
    }
  }
}
</style>

<style lang="scss">
html.high-contrast-max .about {
  --about-card-bg: #ffffff !important;
  --about-card-border: #000000 !important;
  --about-shadow: transparent !important;
  --about-text: #000000 !important;
  --about-text-secondary: #000000 !important;
  --about-accent: #000000 !important;
  --about-blue: #000000 !important;
  --about-tag-bg: #ffffff !important;
  --about-tag-bg-hover: #ffffff !important;

  .about-item {
    border: 3px solid #000000 !important;
    box-shadow: none !important;
    background-color: #ffffff !important;
    color: #000000 !important;
  }

  .about-item.hello {
    background-image: none !important;
    background-color: #ffffff !important;
  }

  // 压过行内硬编码色（扩列卡等）；!important 可覆盖无 !important 的行内 style
  .about-item,
  .about-item * {
    color: #000000 !important;
    opacity: 1 !important;
  }

  .skills-item {
    border-color: #000000 !important;
    background: #ffffff !important;
  }

  .view-btn {
    background: #000000 !important;
    color: #ffffff !important;
  }
}

html.dark.high-contrast-max .about {
  --about-card-bg: #000000 !important;
  --about-card-border: #ffffff !important;
  --about-shadow: transparent !important;
  --about-text: #ffffff !important;
  --about-text-secondary: #ffffff !important;
  --about-accent: #ffffff !important;
  --about-blue: #ffffff !important;
  --about-tag-bg: #000000 !important;
  --about-tag-bg-hover: #000000 !important;

  .about-item {
    border: 3px solid #ffffff !important;
    box-shadow: none !important;
    background-color: #000000 !important;
    color: #ffffff !important;
  }

  .about-item.hello {
    background-image: none !important;
    background-color: #000000 !important;
  }

  .about-item,
  .about-item * {
    color: #ffffff !important;
    opacity: 1 !important;
  }

  .skills-item {
    border-color: #ffffff !important;
    background: #000000 !important;
  }

  .view-btn {
    background: #ffffff !important;
    color: #000000 !important;
  }
}
</style>
