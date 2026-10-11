<!-- 全局设置 -->
<template>
  <div class="settings">
    <!-- 设置面板 -->
    <Modal
      :show="store.showSettings"
      title="个性化配置"
      titleIcon="style"
      @mask-click="store.changeShowStatus('showSettings')"
      @modal-close="store.changeShowStatus('showSettings')"
    >
      <div class="set-list">
        <div v-if="store.devMode === 2" class="set-warn set-warn-static">
          <span class="warn-text">当前处于开发模式，提交代码时应退出开发模式</span>
        </div>
        <!-- 开发模式选项 -->
        <template v-if="store.devMode === 2">
          <div class="set-item">
            <span class="set-label set-label-channel">开发模式选项</span>
            <div class="set-options">
              <span
                :class="['options', { choose: devModeOptionsExpanded }]"
                @click="devModeOptionsExpanded = !devModeOptionsExpanded"
              >
                {{ devModeOptionsExpanded ? "收起" : "展开" }}
              </span>
            </div>
          </div>
          <Transition name="fade-up">
            <div v-if="devModeOptionsExpanded" class="set-expand-box">
              <div class="set-item">
                <span class="set-label">展开所有设置分组</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !expandAllGroups }]"
                    @click="handleCollapseAllGroups"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: expandAllGroups }]"
                    @click="handleExpandAllGroups"
                  >
                    开启
                  </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">停用所有开发中的功能</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !devFeaturesDisabled }]"
                    @click="restoreDefaultDevFeatures"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: devFeaturesDisabled }]"
                    @click="disableAllDevFeatures"
                  >
                    开启
                  </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">版本信息</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: versionFieldsExpanded }]"
                    @click="versionFieldsExpanded = !versionFieldsExpanded"
                  >
                    {{ versionFieldsExpanded ? "收起" : "展开" }}
                  </span>
                </div>
              </div>
              <Transition name="fade-up">
                <div v-if="versionFieldsExpanded" class="set-expand-box">
                  <div class="set-item">
                    <span class="set-label">站点基础版本</span>
                    <div class="set-options">
                      <input
                        v-model="siteVersion"
                        type="text"
                        style="
                          padding: 6px 8px;
                          font-size: 0.9375rem;
                          border-radius: 8px;
                          min-width: 30px;
                          border: 1px solid var(--main-card-border);
                          background-color: var(--main-card-background);
                          color: var(--main-font-color);
                          font-family: var(--main-font-family);
                          text-align: center;
                          height: 100%;
                          box-sizing: border-box;
                        "
                        placeholder="V1.1"
                      />
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">站点基础版本日期</span>
                    <div class="set-options">
                      <input
                        v-model="siteVersionDate"
                        type="text"
                        style="
                          padding: 6px 8px;
                          font-size: 0.9375rem;
                          border-radius: 8px;
                          min-width: 30px;
                          border: 1px solid var(--main-card-border);
                          background-color: var(--main-card-background);
                          color: var(--main-font-color);
                          font-family: var(--main-font-family);
                          text-align: center;
                          height: 100%;
                          box-sizing: border-box;
                        "
                        placeholder="2026.8.24"
                      />
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">当前版本内部版本</span>
                    <div class="set-options">
                      <input
                        v-model="branchVersion"
                        type="text"
                        style="
                          padding: 6px 8px;
                          font-size: 0.9375rem;
                          border-radius: 8px;
                          min-width: 30px;
                          border: 1px solid var(--main-card-border);
                          background-color: var(--main-card-background);
                          color: var(--main-font-color);
                          font-family: var(--main-font-family);
                          text-align: center;
                          height: 100%;
                          box-sizing: border-box;
                        "
                        placeholder="106"
                      />
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">内部版本构建时间</span>
                    <div class="set-options">
                      <input
                        v-model="branchBuildTime"
                        type="text"
                        style="
                          padding: 6px 8px;
                          font-size: 0.9375rem;
                          border-radius: 8px;
                          min-width: 30px;
                          border: 1px solid var(--main-card-border);
                          background-color: var(--main-card-background);
                          color: var(--main-font-color);
                          font-family: var(--main-font-family);
                          text-align: center;
                          height: 100%;
                          box-sizing: border-box;
                        "
                        placeholder="2026.09.22 15:24:38"
                      />
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">自动获取内部版本构建时间</span>
                    <div class="set-options">
                      <span class="options" @click="autoFillBranchBuildTime">执行</span>
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">确认修改</span>
                    <div class="set-options">
                      <span class="options" @click="confirmAllVersionFields">执行</span>
                    </div>
                  </div>
                </div>
              </Transition>
              <div class="set-item">
                <span class="set-label">DEFAULT_DEV_MODE 随机化</span>
                <div class="set-options">
                  <span class="options" @click="randomizeDefaultDevMode">确认</span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">清除所有数据</span>
                <div class="set-options">
                  <span class="options" @click.stop="handleClearDataKeepDevMode"> 确认 </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">关闭开发模式</span>
                <div class="set-options">
                  <span class="options" @click="closeDevModeConfirmVisible = true"> 确认 </span>
                </div>
              </div>
              <Transition name="fade-up">
                <div
                  v-if="closeDevModeConfirmVisible"
                  class="set-warn"
                  @click="closeDevModeConfirmVisible = false"
                >
                  <span class="warn-text"
                    >你指的是要关闭开发模式吗 / 请确认推送前已经完成了相关设置</span
                  >
                  <span class="options" @click.stop="confirmCloseDevMode">确认</span>
                </div>
              </Transition>
            </div>
          </Transition>
        </template>
        <span class="title">基本</span>
        <div class="set-item">
          <span class="set-label">首页样式（ Banner 高度 ）</span>
          <div class="set-options">
            <span
              :class="['options', { choose: bannerType === 'half' }]"
              @click="setBannerType('half')"
            >
              半屏
            </span>
            <span
              :class="['options', { choose: bannerType === 'full' }]"
              @click="setBannerType('full')"
            >
              全屏
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">全站背景</span>
          <div class="set-options">
            <span
              :class="['options', { choose: backgroundType === 'close' }]"
              @click="setBackgroundType('close')"
            >
              关闭
            </span>
            <span
              :class="['options', { choose: backgroundType === 'patterns' }]"
              @click="setBackgroundType('patterns')"
            >
              纹理
            </span>
            <span
              :class="['options', { choose: backgroundType === 'image' }]"
              @click="setBackgroundType('image')"
            >
              图片
            </span>
          </div>
        </div>
        <div v-if="backgroundType === 'image'" class="set-item">
          <span class="set-label">背景图片地址</span>
          <div class="set-options">
            <input
              v-model="backgroundUrl"
              type="url"
              pattern="https?://.+"
              title="请输入有效的网址，例如：http://www.example.com"
              required
            />
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">调整明暗显示外观</span>
          <div class="set-options">
            <span v-if="scheduledThemeEnabled" class="options choose"> 定时切换 </span>
            <span
              :class="['options', { choose: !scheduledThemeEnabled && themeType === 'auto' }]"
              @click="setThemeType('auto')"
            >
              跟随系统
            </span>
            <span
              :class="['options', { choose: !scheduledThemeEnabled && themeType === 'dark' }]"
              @click="setThemeType('dark')"
            >
              深色
            </span>
            <span
              :class="['options', { choose: !scheduledThemeEnabled && themeType === 'light' }]"
              @click="setThemeType('light')"
            >
              浅色
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">全站字体</span>
          <div class="set-options">
            <span
              :class="['options', { choose: fontFamily === 'misans' }]"
              @click="setFontFamily('misans')"
            >
              MiSans
            </span>
            <span
              :class="['options', { choose: fontFamily === 'xlfont' }]"
              @click="setFontFamily('xlfont')"
            >
              小赖字体
            </span>
            <span
              :class="['options', { choose: fontFamily === 'browserfont' }]"
              @click="setFontFamily('browserfont')"
            >
              浏览器字体
            </span>
          </div>
        </div>
        <span class="title">高级</span>
        <div class="set-item">
          <span class="set-label">主题颜色</span>
          <div class="set-options">
            <span
              :class="['options', { choose: themeColorExpanded }]"
              @click="themeColorExpanded = !themeColorExpanded"
            >
              {{ themeColorExpanded ? "收起" : "展开" }}
            </span>
          </div>
        </div>
        <Transition name="fade-up">
          <div v-if="themeColorExpanded" class="set-expand-box">
            <template v-if="highContrast !== 'max'">
              <template v-if="!customThemeEnabled">
                <div class="set-item">
                  <span class="set-label">预设主题</span>
                  <div class="set-options">
                    <span
                      v-for="color in themeColorList"
                      :key="color.value"
                      :class="['options', { choose: themeColor === color.value }]"
                      @click="setThemeColor(color.value)"
                    >
                      {{ color.label }}
                    </span>
                  </div>
                </div>
              </template>
              <div v-else class="set-item">
                <span class="set-label">启用预设主题需要先关闭 自定义主题</span>
                <div class="set-options">
                  <span class="options" @click="toggleCustomTheme(false)">确认</span>
                </div>
              </div>
            </template>
            <div v-else class="set-item">
              <span class="set-label">切换主题需要先关闭 高对比度模式（最高）</span>
              <div class="set-options">
                <span class="options" @click="setHighContrast(false)">确认</span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">高对比度模式</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: !highContrast }]"
                  @click="setHighContrast(false)"
                >
                  关闭
                </span>
                <span
                  :class="['options', { choose: highContrast === true }]"
                  @click="setHighContrast(true)"
                >
                  开启
                </span>
                <span
                  :class="['options', { choose: highContrast === 'max' }]"
                  @click="setHighContrast('max')"
                >
                  最高
                </span>
              </div>
            </div>
            <template v-if="highContrast !== 'max'">
              <div class="set-item">
                <span class="set-label">自定义主题</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !customThemeEnabled }]"
                    @click="toggleCustomTheme(false)"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: customThemeEnabled }]"
                    @click="toggleCustomTheme(true)"
                  >
                    开启
                  </span>
                </div>
              </div>
              <template v-if="customThemeEnabled">
                <div class="set-item">
                  <span class="set-label">自定义主要色（#RRGGBB）</span>
                  <div class="set-options">
                    <div
                      class="color-preview"
                      :style="{ backgroundColor: customPrimaryColor }"
                      @click="$refs.primaryColorInput.click()"
                    ></div>
                    <input
                      ref="primaryColorInput"
                      v-model="customPrimaryColor"
                      type="color"
                      class="color-input-hidden"
                    />
                    <input
                      v-model="customPrimaryColor"
                      type="text"
                      class="text-input"
                      placeholder="#RRGGBB"
                      maxlength="7"
                    />
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">自定义辅助色（#RRGGBB）</span>
                  <div class="set-options">
                    <div
                      class="color-preview"
                      :style="{ backgroundColor: customSecondaryColor }"
                      @click="$refs.secondaryColorInput.click()"
                    ></div>
                    <input
                      ref="secondaryColorInput"
                      v-model="customSecondaryColor"
                      type="color"
                      class="color-input-hidden"
                    />
                    <input
                      v-model="customSecondaryColor"
                      type="text"
                      class="text-input"
                      placeholder="#RRGGBB"
                      maxlength="7"
                    />
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">保存当前自定义主题色</span>
                  <div class="set-options">
                    <span class="options" @click="revertCustomTheme">撤销</span>
                    <span class="options" @click="applyCustomTheme">应用</span>
                  </div>
                </div>
              </template>
            </template>
            <div class="set-item">
              <span class="set-label">移除动画</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: !removeAnimations }]"
                  @click="setRemoveAnimations(false)"
                >
                  关闭
                </span>
                <span
                  :class="['options', { choose: removeAnimations }]"
                  @click="
                    removeAnimations = true;
                    removeAnimationsWarnVisible = true;
                  "
                >
                  开启
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div
                v-if="removeAnimationsWarnVisible"
                class="set-warn"
                @click="
                  removeAnimations = false;
                  removeAnimationsWarnVisible = false;
                "
              >
                <span class="warn-text">开启此选项将移除所有过渡动画，你确定要继续吗</span>
                <span class="options" @click.stop="applyRemoveAnimations">确认</span>
              </div>
            </Transition>
          </div>
        </Transition>
        <div class="set-item">
          <span class="set-label">消息样式</span>
          <div class="set-options">
            <span
              :class="['options', { choose: messageSettingsExpanded }]"
              @click="messageSettingsExpanded = !messageSettingsExpanded"
            >
              {{ messageSettingsExpanded ? "收起" : "展开" }}
            </span>
          </div>
        </div>
        <Transition name="fade-up">
          <div v-if="messageSettingsExpanded" class="set-expand-box">
            <div class="set-item">
              <span class="set-label">消息样式</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: messageStyle === 'bar' }]"
                  @click="setMessageStyle('bar')"
                >
                  传统（不推荐）
                </span>
                <span
                  :class="['options', { choose: messageStyle === 'card' }]"
                  @click="setMessageStyle('card')"
                >
                  卡片
                </span>
                <span
                  :class="['options', { choose: messageStyle === 'island' }]"
                  @click="setMessageStyle('island')"
                >
                  超级岛
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">消息位置</span>
              <div class="set-options">
                <template v-if="messageStyle === 'island'">
                  <span class="options choose">顶部居中</span>
                </template>
                <template v-else-if="messageStyle === 'bar'">
                  <span
                    :class="['options', { choose: messagePosition === 'bar-top' }]"
                    @click="setMessagePosition('bar-top')"
                  >
                    顶部
                  </span>
                  <span
                    :class="['options', { choose: messagePosition === 'bar-bottom' }]"
                    @click="setMessagePosition('bar-bottom')"
                  >
                    底部
                  </span>
                </template>
                <template v-else>
                  <template v-if="isMobileLayout">
                    <span
                      :class="['options', { choose: messagePosition === 'top-center' }]"
                      @click="setMessagePosition('top-center')"
                    >
                      顶部
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'bottom-center' }]"
                      @click="setMessagePosition('bottom-center')"
                    >
                      底部
                    </span>
                  </template>
                  <template v-else>
                    <span
                      :class="['options', { choose: messagePosition === 'left-top' }]"
                      @click="setMessagePosition('left-top')"
                    >
                      左上
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'left-bottom' }]"
                      @click="setMessagePosition('left-bottom')"
                    >
                      左下
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'right-top' }]"
                      @click="setMessagePosition('right-top')"
                    >
                      右上
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'right-bottom' }]"
                      @click="setMessagePosition('right-bottom')"
                    >
                      右下
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'top-center' }]"
                      @click="setMessagePosition('top-center')"
                    >
                      顶部居中
                    </span>
                    <span
                      :class="['options', { choose: messagePosition === 'bottom-center' }]"
                      @click="setMessagePosition('bottom-center')"
                    >
                      底部居中
                    </span>
                  </template>
                </template>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">进度条方向</span>
              <div class="set-options">
                <span
                  v-if="messageDuration > 0"
                  :class="['options', { choose: progressDirection === 'normal' }]"
                  @click="setProgressDirection('normal')"
                >
                  正向
                </span>
                <span
                  v-if="messageDuration > 0"
                  :class="['options', { choose: progressDirection === 'reverse' }]"
                  @click="setProgressDirection('reverse')"
                >
                  逆向
                </span>
                <span
                  :class="['options', { choose: progressDirection === 'decorative' }]"
                  @click="setProgressDirection('decorative')"
                >
                  装饰
                </span>
                <span
                  :class="['options', { choose: progressDirection === 'disabled' }]"
                  @click="setProgressDirection('disabled')"
                >
                  关闭
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">显示时间</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: messageDuration === 1000 }]"
                  @click="setMessageDuration(1000)"
                >
                  1秒
                </span>
                <span
                  :class="['options', { choose: messageDuration === 2000 }]"
                  @click="setMessageDuration(2000)"
                >
                  2秒
                </span>
                <span
                  :class="['options', { choose: messageDuration === 3000 }]"
                  @click="setMessageDuration(3000)"
                >
                  3秒
                </span>
                <span
                  :class="['options', { choose: messageDuration === 5000 }]"
                  @click="setMessageDuration(5000)"
                >
                  5秒
                </span>
                <span
                  :class="['options', { choose: messageDuration === 0 }]"
                  @click="setMessageDuration(0)"
                >
                  手动关闭
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">发送测试消息</span>
              <div class="set-options">
                <span class="options" @click="sendTestMessage('success')">成功</span>
                <span class="options" @click="sendTestMessage('warning')">警告</span>
                <span class="options" @click="sendTestMessage('error')">错误</span>
                <span class="options" @click="sendTestMessage('info')">信息</span>
              </div>
            </div>
          </div>
        </Transition>
        <div class="set-item">
          <span class="set-label">超级岛</span>
          <div class="set-options">
            <span
              :class="['options', { choose: islandSettingsExpanded }]"
              @click="islandSettingsExpanded = !islandSettingsExpanded"
            >
              {{ islandSettingsExpanded ? "收起" : "展开" }}
            </span>
          </div>
        </div>
        <Transition name="fade-up">
          <div v-if="islandSettingsExpanded" class="set-expand-box">
            <template v-if="messageStyle === 'island'">
              <div class="set-item">
                <span class="set-label">超级岛模式</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: islandMode === 'dynamic' }]"
                    @click="setIslandMode('dynamic')"
                  >
                    灵动
                  </span>
                  <span
                    :class="['options', { choose: islandMode === 'extended' }]"
                    @click="setIslandMode('extended')"
                  >
                    拓展
                  </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">使用主题色</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !islandUseThemeColor }]"
                    @click="setIslandUseThemeColor(false)"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: islandUseThemeColor }]"
                    @click="setIslandUseThemeColor(true)"
                  >
                    开启
                  </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">时间读秒</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !islandShowSeconds }]"
                    @click="setIslandShowSeconds(false)"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: islandShowSeconds }]"
                    @click="setIslandShowSeconds(true)"
                  >
                    开启
                  </span>
                </div>
              </div>
              <div class="set-item">
                <span class="set-label">显示日期</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: !islandShowDate }]"
                    @click="setIslandShowDate(false)"
                  >
                    关闭
                  </span>
                  <span
                    :class="['options', { choose: islandShowDate }]"
                    @click="setIslandShowDate(true)"
                  >
                    开启
                  </span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="set-item">
                <span class="set-label">需要先将消息类型切换为 超级岛</span>
                <div class="set-options">
                  <span class="options" @click="setMessageStyle('island')">确认</span>
                </div>
              </div>
            </template>
          </div>
        </Transition>
        <div class="set-item">
          <span class="set-label">音乐播放器</span>
          <div class="set-options">
            <span
              :class="['options', { choose: musicPlayerExpanded }]"
              @click="musicPlayerExpanded = !musicPlayerExpanded"
            >
              {{ musicPlayerExpanded ? "收起" : "展开" }}
            </span>
          </div>
        </div>
        <Transition name="fade-up">
          <div v-if="musicPlayerExpanded" class="set-expand-box">
            <div class="set-item">
              <span class="set-label">音乐播放器</span>
              <div class="set-options">
                <span :class="['options', { choose: !playerShow }]" @click="playerShow = false">
                  关闭
                </span>
                <span :class="['options', { choose: playerShow }]" @click="playerShow = true">
                  开启
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">样式</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: islandStyle === 'standard' }]"
                  @click="islandStyle = 'standard'"
                >
                  标准
                </span>
                <span
                  :class="['options', { choose: islandStyle === 'extended' }]"
                  @click="islandStyle = 'extended'"
                >
                  拓展
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">进入站点自动播放音乐</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: !playerAutoPlay }]"
                  @click="playerAutoPlay = false"
                >
                  关闭
                </span>
                <span
                  :class="['options', { choose: playerAutoPlay }]"
                  @click="playerAutoPlay = true"
                >
                  开启
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">播放模式</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: playerPlayMode === 'list' }]"
                  @click="playerPlayMode = 'list'"
                >
                  顺序
                </span>
                <span
                  :class="['options', { choose: playerPlayMode === 'shuffle' }]"
                  @click="playerPlayMode = 'shuffle'"
                >
                  随机
                </span>
                <span
                  :class="['options', { choose: playerPlayMode === 'single' }]"
                  @click="playerPlayMode = 'single'"
                >
                  单曲循环
                </span>
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">歌单来源</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: playerMusicSource === 'preset' }]"
                  @click="playerMusicSource = 'preset'"
                >
                  泠の预设
                </span>
                <span
                  :class="['options', { choose: playerMusicSource === 'custom' }]"
                  @click="playerMusicSource = 'custom'"
                >
                  自定义
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div v-if="playerMusicSource === 'custom'" class="set-item">
                <span class="set-label">自定义歌单ID（网易云音乐）</span>
                <div class="set-options">
                  <input
                    v-model="playerCustomIdsInput"
                    type="text"
                    style="
                      padding: 6px 8px;
                      font-size: 0.9375rem;
                      border-radius: 8px;
                      min-width: 120px;
                      border: 1px solid var(--main-card-border);
                      background-color: var(--main-card-background);
                      color: var(--main-font-color);
                      font-family: var(--main-font-family);
                      text-align: center;
                      height: 100%;
                      box-sizing: border-box;
                    "
                    placeholder="多个ID用逗号分隔"
                    @keyup.enter="confirmCustomIds"
                  />
                  <span class="options" @click="confirmCustomIds">确定</span>
                </div>
              </div>
            </Transition>
            <div class="set-item">
              <span class="set-label">超级岛支持</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: !islandPlayerSupport }]"
                  @click="islandPlayerSupport = false"
                >
                  关闭
                </span>
                <span
                  :class="['options', { choose: islandPlayerSupport }]"
                  @click="islandPlayerSupport = true"
                >
                  开启
                </span>
              </div>
            </div>
          </div>
        </Transition>
        <span class="title">杂项</span>
        <div class="set-item">
          <span class="set-label">额外信息显示位置</span>
          <div class="set-options">
            <span
              :class="['options', { choose: infoPosition === 'normal' }]"
              @click="setInfoPosition('normal')"
            >
              默认位置
            </span>
            <span
              :class="['options', { choose: infoPosition === 'fixed' }]"
              @click="setInfoPosition('fixed')"
            >
              右下角
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">自定义右键菜单</span>
          <div class="set-options">
            <span :class="['options', { choose: !useRightMenu }]" @click="setRightMenu(false)">
              关闭
            </span>
            <span :class="['options', { choose: useRightMenu }]" @click="setRightMenu(true)">
              开启
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">自定义光标样式</span>
          <div class="set-options">
            <span
              :class="['options', { choose: !useCustomCursor }]"
              @click="setCustomCursor(false)"
            >
              关闭
            </span>
            <span :class="['options', { choose: useCustomCursor }]" @click="setCustomCursor(true)">
              开启
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">阅读进度条</span>
          <div class="set-options">
            <span
              :class="['options', { choose: !readingProgressEnabled }]"
              @click="readingProgressEnabled = false"
            >
              关闭
            </span>
            <span
              :class="['options', { choose: readingProgressEnabled }]"
              @click="readingProgressEnabled = true"
            >
              开启
            </span>
          </div>
        </div>
        <div class="set-item">
          <span class="set-label">显示更多选项</span>
          <div class="set-options">
            <span
              :class="['options', { choose: !showMoreSettings }]"
              @click="setShowMoreSettings(false)"
            >
              关闭
            </span>
            <span
              :class="['options', { choose: showMoreSettings }]"
              @click="setShowMoreSettings(true)"
            >
              开启
            </span>
          </div>
        </div>
        <Transition name="fade-up">
          <div
            v-if="showMoreSettingsWarnVisible"
            ref="warnRef"
            class="set-warn"
            @click="
              showMoreSettings = false;
              showMoreSettingsWarnVisible = false;
            "
          >
            <span class="warn-text">你指的是要更改更多的选项吗，这可能导致未知的问题</span>
            <span class="options" @click.stop="confirmShowMoreSettings">确认</span>
          </div>
        </Transition>
        <Transition name="fade-up">
          <div v-if="showMoreSettings && showMoreSettingsConfirmed" class="more-options">
            <div class="set-item">
              <span class="set-label">更多字体选项</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: moreFontsExpanded }]"
                  @click="handleMoreFontsClick"
                >
                  {{ moreFontsExpanded ? "收起" : "展开" }}
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div v-if="moreFontsExpanded" class="set-expand-box">
                <div class="set-item">
                  <span class="set-label">更多字体</span>
                  <div class="set-options">
                    <span
                      :class="['options', { choose: fontFamily === 'vsans' }]"
                      @click="setFontFamily('vsans')"
                    >
                      vivo Sans
                    </span>
                    <span
                      :class="['options', { choose: fontFamily === 'hmos' }]"
                      @click="setFontFamily('hmos')"
                    >
                      HarmonyOS Sans
                    </span>
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">全站字体大小</span>
                  <div class="set-options">
                    <span
                      v-if="!fontSizeEditing"
                      class="options"
                      @click="fontSizeWarnVisible = true"
                      >修改</span
                    >
                    <template v-if="fontSizeEditing">
                      <span v-if="fontSize !== 17" class="options" @click="resetFontSize"
                        >恢复默认</span
                      >
                      <span class="options" @click="store.changeFontSize(false)"> - </span>
                      <span class="num">{{ fontSize }}</span>
                      <span class="options" @click="store.changeFontSize(true)"> + </span>
                      <span class="options" @click="cancelFontSizeEdit">取消</span>
                      <span class="options" @click="confirmFontSizeEdit">确认</span>
                    </template>
                  </div>
                </div>
                <Transition name="fade-up">
                  <div
                    v-if="fontSizeWarnVisible"
                    class="set-warn"
                    @click="fontSizeWarnVisible = false"
                  >
                    <span class="warn-text">你指的是要修改字体大小吗，这可能导致未知的问题</span>
                    <span
                      class="options"
                      @click.stop="
                        fontSizeEditing = true;
                        fontSizeWarnVisible = false;
                        store.fontSizePending = true;
                      "
                      >确认</span
                    >
                  </div>
                </Transition>
              </div>
            </Transition>
            <span class="title">实验性功能</span>
            <span class="set-desc">以下选项处于实验性阶段，可能出现未知的问题</span>
            <div class="set-item">
              <span class="set-label">页面布局</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: siteLayoutDisplay === 'auto' }]"
                  @click="handleLayoutAuto"
                >
                  自动选择
                </span>
                <span
                  :class="['options', { choose: siteLayoutDisplay === 'pc' }]"
                  @click="handleLayoutChange('pc')"
                >
                  桌面端
                </span>
                <span
                  :class="['options', { choose: siteLayoutDisplay === 'mobile' }]"
                  @click="handleLayoutChange('mobile')"
                >
                  移动端
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div
                v-if="layoutWarnVisible"
                class="set-warn"
                @click="
                  layoutWarnVisible = false;
                  siteLayoutDisplay = siteLayout;
                "
              >
                <span class="warn-text">你指的是要强制更改页面布局吗，这可能导致未知的问题</span>
                <span class="options" @click.stop="handleLayoutWarnConfirm">确认</span>
              </div>
            </Transition>
            <Transition name="fade-up">
              <div
                v-if="layoutConfirmVisible"
                class="set-warn set-warn-purple"
                @click="handleLayoutFail"
              >
                <span />
                <span class="warn-text">网站能正常显示吗？</span>
                <span class="warn-countdown">{{ layoutCountdown }}秒后将恢复自动选择</span>
                <div class="warn-actions">
                  <span class="options warn-no" @click.stop="handleLayoutFail">不能</span>
                  <span class="options warn-yes" @click.stop="handleLayoutOk">是的</span>
                </div>
              </div>
            </Transition>
            <div class="set-item">
              <span class="set-label">定时切换明暗显示外观</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: !scheduledThemeEnabled }]"
                  @click="toggleScheduledTheme(false)"
                >
                  关闭
                </span>
                <span
                  :class="['options', { choose: scheduledThemeEnabled }]"
                  @click="toggleScheduledTheme(true)"
                >
                  开启
                </span>
              </div>
            </div>
            <div v-if="scheduledThemeEnabled" class="set-item">
              <span class="set-label">浅色模式时间</span>
              <div class="set-options">
                <input
                  v-model="scheduledLightTime"
                  type="time"
                  class="time-input"
                  @change="onScheduledTimeChange"
                />
              </div>
            </div>
            <div v-if="scheduledThemeEnabled" class="set-item">
              <span class="set-label">深色模式时间</span>
              <div class="set-options">
                <input
                  v-model="scheduledDarkTime"
                  type="time"
                  class="time-input"
                  @change="onScheduledTimeChange"
                />
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">天气小组件</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: weatherSectionExpanded }]"
                  @click="weatherSectionExpanded = !weatherSectionExpanded"
                >
                  {{ weatherSectionExpanded ? "收起" : "展开" }}
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div v-if="weatherSectionExpanded" class="set-expand-box">
                <div class="set-item">
                  <span class="set-label">天气小组件</span>
                  <div class="set-options">
                    <span
                      :class="['options', { choose: !weatherWidgetEnabled }]"
                      @click="weatherWidgetEnabled = false"
                    >
                      关闭
                    </span>
                    <span
                      :class="['options', { choose: weatherWidgetEnabled }]"
                      @click="weatherWidgetEnabled = true"
                    >
                      开启
                    </span>
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">定位方式</span>
                  <div class="set-options">
                    <span
                      :class="['options', { choose: weatherLocationMode === 'satellite' }]"
                      @click="switchLocationMode('satellite', '自动')"
                    >
                      自动
                    </span>
                    <span
                      :class="['options', { choose: weatherLocationMode === 'ip' }]"
                      @click="switchLocationMode('ip', 'IP地址')"
                    >
                      IP地址
                    </span>
                    <span
                      :class="['options', { choose: weatherLocationMode === 'manual' }]"
                      @click="switchLocationMode('manual', '自定义')"
                    >
                      自定义
                    </span>
                  </div>
                </div>
                <div v-if="weatherLocationMode === 'manual'" class="set-item">
                  <span class="set-label">城市名称</span>
                  <div class="set-options">
                    <input
                      v-model="weatherManualCity"
                      type="text"
                      style="
                        padding: 6px 8px;
                        font-size: 0.9375rem;
                        border-radius: 8px;
                        min-width: 80px;
                        border: 1px solid var(--main-card-border);
                        background-color: var(--main-card-background);
                        color: var(--main-font-color);
                        font-family: var(--main-font-family);
                        text-align: center;
                        height: 100%;
                        box-sizing: border-box;
                      "
                      placeholder="例如：苏州"
                      @keyup.enter="
                        weatherRefreshTrigger++;
                        window.dispatchEvent(new Event('weather-refresh'));
                      "
                    />
                    <span
                      class="options"
                      @click="
                        weatherRefreshTrigger++;
                        window.dispatchEvent(new Event('weather-refresh'));
                      "
                    >
                      确认
                    </span>
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">天气数据源</span>
                  <div class="set-options">
                    <span
                      :class="['options', { choose: weatherProvider === 'amap' }]"
                      @click="switchWeatherProvider('amap')"
                    >
                      高德
                    </span>
                    <span
                      :class="['options', { choose: weatherProvider === 'wttr' }]"
                      @click="switchWeatherProvider('wttr')"
                    >
                      wttr.in
                    </span>
                    <span
                      :class="['options', { choose: weatherProvider === 'openmeteo' }]"
                      @click="switchWeatherProvider('openmeteo')"
                    >
                      Open-Meteo
                    </span>
                  </div>
                </div>
              </div>
            </Transition>
            <!-- 开发中的功能（开发模式） -->
            <template v-if="store.devMode === 2">
              <div class="set-item">
                <span class="set-label">开发中的功能</span>
                <div class="set-options">
                  <span
                    :class="['options', { choose: devFeaturesExpanded }]"
                    @click="devFeaturesExpanded = !devFeaturesExpanded"
                  >
                    {{ devFeaturesExpanded ? "收起" : "展开" }}
                  </span>
                </div>
              </div>
              <Transition name="fade-up">
                <div v-if="devFeaturesExpanded" class="set-expand-box">
                  <div class="set-item">
                    <span class="set-label">背景模糊</span>
                    <div class="set-options">
                      <span
                        :class="['options', { choose: !backgroundBlur }]"
                        @click="backgroundBlur = false"
                      >
                        关闭
                      </span>
                      <span
                        :class="['options', { choose: backgroundBlur }]"
                        @click="backgroundBlur = true"
                      >
                        开启
                      </span>
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">PWA 缓存增强</span>
                    <div class="set-options">
                      <span
                        :class="['options', { choose: !pwaCacheEnabled }]"
                        @click="pwaCacheEnabled = false"
                      >
                        关闭
                      </span>
                      <span
                        :class="['options', { choose: pwaCacheEnabled }]"
                        @click="pwaCacheEnabled = true"
                      >
                        开启
                      </span>
                    </div>
                  </div>
                  <div v-if="pwaCacheEnabled" class="set-item">
                    <span class="set-label">缓存条目上限</span>
                    <div class="set-options">
                      <span
                        v-for="limit in [50, 100, 200, 500, 0]"
                        :key="limit"
                        :class="['options', { choose: pwaCacheLimit === limit }]"
                        @click="pwaCacheLimit = limit"
                      >
                        {{ limit === 0 ? "无限" : limit }}
                      </span>
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">清除 PWA 缓存</span>
                    <div class="set-options">
                      <span class="options" @click="clearPwaCache"> 清除 </span>
                    </div>
                  </div>
                  <div class="set-item">
                    <span class="set-label">WebP 自动转换</span>
                    <div class="set-options">
                      <span
                        :class="['options', { choose: !imageWebpEnabled }]"
                        @click="imageWebpEnabled = false"
                      >
                        关闭
                      </span>
                      <span
                        :class="['options', { choose: imageWebpEnabled }]"
                        @click="imageWebpEnabled = true"
                      >
                        开启
                      </span>
                    </div>
                  </div>
                </div>
              </Transition>
            </template>
            <span class="title">关于</span>
            <div class="set-item">
              <span class="set-label">本站信息</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: aboutWebsiteExpanded }]"
                  @click="aboutWebsiteExpanded = !aboutWebsiteExpanded"
                >
                  {{ aboutWebsiteExpanded ? "收起" : "展开" }}
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div v-if="aboutWebsiteExpanded" class="set-expand-box">
                <div class="set-item">
                  <span class="set-label">当前分支内部版本</span>
                  <div class="set-options">
                    <span class="about-version-pill">{{ branchVersion }}</span>
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">内部版本构建时间</span>
                  <div class="set-options">
                    <span class="about-version-pill">{{ branchBuildTime || "暂无" }}</span>
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">基础版本（release）</span>
                  <div class="set-options">
                    <span class="about-version-pill"
                      >{{ siteVersion }} - {{ siteVersionDate }}</span
                    >
                  </div>
                </div>
                <div class="set-item">
                  <span class="set-label">关于本站</span>
                  <div class="set-options">
                    <a
                      href="/pages/about-website.html"
                      class="options"
                      @click="store.changeShowStatus('showSettings')"
                      >前往</a
                    >
                  </div>
                </div>
              </div>
            </Transition>
            <div class="set-item">
              <span class="set-label">分支策略</span>
              <div class="set-options">
                <span
                  :class="['options', { choose: branchStrategyExpanded }]"
                  @click="branchStrategyExpanded = !branchStrategyExpanded"
                >
                  {{ branchStrategyExpanded ? "收起" : "展开" }}
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div v-if="branchStrategyExpanded" class="set-expand-box">
                <!-- 开发模式入口 -->
                <Transition name="fade-up">
                  <template v-if="devModeEntryVisible">
                    <div
                      v-if="devModeEntrySuccess"
                      class="set-warn"
                      @click="devModeEntryClose"
                      style="cursor: pointer"
                    >
                      <span class="warn-text">成功</span>
                      <span class="options">确定</span>
                    </div>
                    <div v-else-if="devModeEntryError" class="set-warn set-warn-static">
                      <span class="warn-text">错误</span>
                      <span class="options" @click="devModeEntryClose">确定</span>
                    </div>
                    <div v-else-if="devModeEntryStep === 0" class="set-item">
                      <span class="set-label" style="color: var(--main-error-color)"
                        >你指的是要进入开发模式吗，请不要在生产环境执行此操作</span
                      >
                      <div class="set-options">
                        <span class="options" @click="devModeEntryClose">取消</span>
                        <span
                          class="options devmode-yes-btn"
                          @click="
                            devModeEntryStep = 1;
                            resetDevModeEntryTimer();
                          "
                          >确认</span
                        >
                      </div>
                    </div>
                    <div v-else-if="devModeEntryStep === 1" class="set-item">
                      <span class="set-label" style="color: var(--main-error-color)">需要验证</span>
                      <div class="set-options">
                        <input
                          v-model="devModeEntryInput"
                          class="devmode-entry-input"
                          type="text"
                          placeholder="验证码"
                          @input="resetDevModeEntryTimer"
                          @keyup.enter="devModeEntryVerify"
                        />
                        <span class="options devmode-yes-btn" @click="devModeEntryVerify"
                          >继续</span
                        >
                      </div>
                    </div>
                  </template>
                </Transition>
                <div class="set-item set-item-channel">
                  <span class="set-label">master分支（release）</span>
                  <span class="set-desc"
                    >定期收拢各分支进度，更新版本。<br />建议下游开发者跟进此分支。</span
                  >
                </div>
                <div class="set-item set-item-channel">
                  <span class="set-label">selfuse分支</span>
                  <span class="set-desc">用于作者日常更新，本站的部署跟随该分支。</span>
                </div>
                <div class="set-item set-item-channel">
                  <span class="set-label">dev/beta/canary分支</span>
                  <span class="set-desc"
                    >由于不再需要，已移除。<br />「它们已经完成了它们的使命。」</span
                  >
                </div>
              </div>
            </Transition>
            <div class="set-item">
              <span class="set-label">查看源码</span>
              <div class="set-options">
                <a
                  href="https://github.com/mrsksyrx/vitepress-theme-curve/tree/master"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="options"
                  >Github</a
                >
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">反馈与建议</span>
              <div class="set-options">
                <a
                  href="mailto:sgexilq@qq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="options"
                  >EMail</a
                >
                <a
                  href="https://myat-qq.20091010.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="options"
                  >QQ</a
                >
                <a
                  href="https://github.com/mrsksyrx/vitepress-theme-curve/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="options"
                  >Github</a
                >
              </div>
            </div>
            <div class="set-item">
              <span class="set-label">导入/导出配置</span>
              <div class="set-options">
                <span class="options" @click="handleImportConfig">导入</span>
                <span class="options" @click="handleExportConfig">导出</span>
              </div>
            </div>
            <input
              ref="importFileInput"
              type="file"
              accept=".dat,.json"
              style="display: none"
              @change="handleFileImport"
            />
            <Transition name="fade-up">
              <div
                v-if="importConfirmVisible"
                class="set-warn set-warn-purple-import"
                @click="cancelImportConfirm"
              >
                <span class="warn-text">你指的是要导入配置数据吗</span>
                <span class="options" @click.stop="confirmImportConfirm">确认</span>
              </div>
            </Transition>
            <Transition name="fade-up">
              <div v-if="importWarnVisible" class="set-warn set-warn-red">
                <template v-if="importWarnType === 'high'">
                  <span
                    class="warn-text"
                    v-html="'你导入的配置文件版本过高，无法导入<br>请联系网站管理员拉取更新'"
                  ></span>
                  <div class="warn-actions">
                    <span class="warn-yes" @click="cancelImportWarn">确认</span>
                  </div>
                </template>
                <template v-else-if="importWarnType === 'low'">
                  <span class="warn-text"
                    >你导入的配置文件版本过低，可能存在兼容性问题，你确定要继续吗</span
                  >
                  <div class="warn-actions">
                    <span class="warn-no" @click="cancelImportWarn">取消</span>
                    <span class="warn-yes" @click="confirmImportWarn">确认</span>
                  </div>
                </template>
              </div>
            </Transition>
            <div class="set-item">
              <span class="set-label">恢复默认配置</span>
              <div class="set-options">
                <span
                  v-if="!showResetConfirm"
                  class="options reset-btn"
                  @click="
                    showResetConfirm = true;
                    scrollToResetWarn();
                    showResetWarning();
                  "
                >
                  确认
                </span>
              </div>
            </div>
            <Transition name="fade-up">
              <div
                v-if="showResetConfirm"
                ref="resetWarnRef"
                class="set-warn"
                @click="showResetConfirm = false"
              >
                <span class="warn-text"
                  >你指的是要恢复默认配置吗，此操作将清空所有本地存储并完全重新拉取资源</span
                >
                <span class="options" @click.stop="handleResetConfig">确认</span>
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { mainStore } from "@/store";
import { useConfigIO } from "@/utils/useConfigIO.mjs";
import { useIsMobileLayout } from "@/utils/layout.js";

const store = mainStore();
const { theme } = useData();
const {
  importFileInput,
  importConfirmVisible,
  importWarnVisible,
  importWarnType,
  handleExportConfig,
  handleImportConfig,
  handleFileImport,
  confirmImportWarn,
  cancelImportWarn,
  confirmImportConfirm,
  cancelImportConfirm,
} = useConfigIO(store.siteVersion || theme.siteVersion || "V1.0");
const {
  themeType,
  themeColor,
  highContrast,
  fontFamily,
  fontSize,
  infoPosition,
  backgroundType,
  backgroundUrl,
  bannerType,
  backgroundBlur,
  playerShow,
  playerAutoPlay,
  playerPlayMode,
  playerMusicSource,
  playerCustomIds,
  showMoreSettings,
  showMoreSettingsConfirmed,
  devFeaturesExpanded,
  branchStrategyExpanded,
  useRightMenu,
  useCustomCursor,
  siteLayout,
  siteLayoutPending,
  lastSiteLayout,
  messageStyle,
  messagePosition,
  progressDirection,
  messageDuration,
  islandMode,
  islandUseThemeColor,
  islandShowSeconds,
  islandShowDate,
  islandPlayerSupport,
  islandStyle,
  customThemeEnabled,
  customPrimaryColor,
  customSecondaryColor,
  lastCustomPrimaryColor,
  lastCustomSecondaryColor,
  customThemeBeforeHighContrast,
  removeAnimations,
  scheduledThemeEnabled,
  scheduledLightTime,
  scheduledDarkTime,
  pwaCacheEnabled,
  pwaCacheLimit,
  readingProgressEnabled,
  imageWebpEnabled,
  weatherProvider,
  weatherLocationMode,
  weatherManualCity,
  weatherRefreshTrigger,
  weatherWidgetEnabled,
  weatherSectionExpanded,
  devModeOptionsExpanded,
  siteVersion,
  siteVersionDate,
  branchVersion,
  branchBuildTime,
} = storeToRefs(store);

// PWA 缓存增强相关
const pwaCacheClearing = ref(false);
const clearPwaCache = async () => {
  if (typeof $message === "undefined" || pwaCacheClearing.value) return;
  pwaCacheClearing.value = true;
  try {
    // 清除运行时缓存（保留预缓存）
    const cacheNames = await caches.keys();
    const runtimeCaches = ["api-cache", "html-cache", "page-cache", "post-cache"];
    let cleared = 0;
    for (const name of cacheNames) {
      if (runtimeCaches.some((rc) => name.includes(rc))) {
        await caches.delete(name);
        cleared++;
      }
    }
    $message.success(`已清除 ${cleared} 个运行时缓存`, { duration: 2000 });
  } catch (e) {
    console.error("Clear PWA cache failed:", e);
    $message.error("清除缓存失败", { duration: 2000 });
  } finally {
    pwaCacheClearing.value = false;
  }
};

// 判断是否使用移动端布局
const isMobileLayout = useIsMobileLayout();

// 警告区域自动滚动
const warnRef = ref(null);
const scrollToWarn = () => {
  nextTick(() => {
    warnRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

// 页面布局确认逻辑
const layoutConfirmVisible = ref(false);
const layoutCountdown = ref(10);
const layoutWarnVisible = ref(false);
const layoutWarnTarget = ref("");
const siteLayoutDisplay = ref(siteLayout.value);
let layoutTimer = null;

const startLayoutCountdown = () => {
  clearLayoutCountdown();
  layoutCountdown.value = 10;
  layoutConfirmVisible.value = true;
  siteLayoutPending.value = true;
  // 显示警告消息
  if (typeof $message !== "undefined") {
    $message.warning(
      `页面布局未确认，<span style="color: var(--main-color)">10</span>秒后将恢复自动选择`,
      { duration: 10000, html: true },
    );
  }
  layoutTimer = setInterval(() => {
    layoutCountdown.value--;
    if (layoutCountdown.value <= 0) {
      handleLayoutFail();
    }
  }, 1000);
};

const clearLayoutCountdown = () => {
  if (layoutTimer) {
    clearInterval(layoutTimer);
    layoutTimer = null;
  }
};

const handleLayoutChange = (layout) => {
  siteLayoutDisplay.value = layout;
  layoutWarnTarget.value = layout;
  layoutWarnVisible.value = true;
};

const handleLayoutWarnConfirm = () => {
  siteLayout.value = layoutWarnTarget.value;
  layoutWarnVisible.value = false;
  startLayoutCountdown();
};

const handleLayoutAuto = () => {
  siteLayout.value = "auto";
  siteLayoutDisplay.value = "auto";
  siteLayoutPending.value = false;
  layoutWarnVisible.value = false;
  layoutConfirmVisible.value = false;
  clearLayoutCountdown();
  if (typeof $message !== "undefined") {
    $message.success("页面布局切换为自动选择");
  }
};

const handleLayoutFail = () => {
  siteLayout.value = "auto";
  siteLayoutDisplay.value = "auto";
  siteLayoutPending.value = false;
  layoutConfirmVisible.value = false;
  clearLayoutCountdown();
  if (typeof $message !== "undefined") {
    $message.warning("页面布局未确认，已恢复为自动选择");
  }
};

const handleLayoutOk = () => {
  siteLayoutPending.value = false;
  layoutConfirmVisible.value = false;
  clearLayoutCountdown();
  const layoutName = siteLayout.value === "pc" ? "桌面端" : "移动端";
  if (typeof $message !== "undefined") {
    $message.success(`页面布局已强制切换为 ${layoutName}`);
  }
};

// 消息设置展开状态
const messageSettingsExpanded = ref(false);
const moreFontsExpanded = ref(false);
// 开发模式入口
const devModeEntryVisible = ref(false);
const devModeEntryStep = ref(0);
const devModeEntryInput = ref("");
const devModeEntryError = ref(false);
const devModeEntrySuccess = ref(false);
// 超级岛设置展开状态
const islandSettingsExpanded = ref(false);
// 音乐播放器设置展开状态
const musicPlayerExpanded = ref(false);
// 自定义歌单 ID 临时输入值
const playerCustomIdsInput = ref(playerCustomIds.value);
const confirmCustomIds = () => {
  playerCustomIds.value = playerCustomIdsInput.value;
  if (typeof $message !== "undefined") {
    $message.success("歌单 ID 已更新");
  }
};
// 展开所有设置分组（开发模式启用时默认开启；手动关闭仅本会话有效，不写入 index.js）
const aboutWebsiteExpanded = ref(false);
// 开发模式选项里「版本信息」合并菜单展开状态
const versionFieldsExpanded = ref(false);
const expandAllGroups = ref(store.devMode === 2);
const applyExpandAllGroups = () => {
  showMoreSettings.value = true;
  showMoreSettingsConfirmed.value = true;
  themeColorExpanded.value = true;
  messageSettingsExpanded.value = true;
  islandSettingsExpanded.value = true;
  musicPlayerExpanded.value = true;
  moreFontsExpanded.value = true;
  weatherSectionExpanded.value = true;
  devFeaturesExpanded.value = true;
  aboutWebsiteExpanded.value = true;
  branchStrategyExpanded.value = true;
};
const applyCollapseAllGroups = () => {
  showMoreSettings.value = false;
  showMoreSettingsConfirmed.value = false;
  themeColorExpanded.value = false;
  messageSettingsExpanded.value = false;
  islandSettingsExpanded.value = false;
  musicPlayerExpanded.value = false;
  moreFontsExpanded.value = false;
  weatherSectionExpanded.value = false;
  devFeaturesExpanded.value = false;
  aboutWebsiteExpanded.value = false;
  branchStrategyExpanded.value = false;
};
const handleExpandAllGroups = () => {
  expandAllGroups.value = true;
  applyExpandAllGroups();
};
const handleCollapseAllGroups = () => {
  expandAllGroups.value = false;
  applyCollapseAllGroups();
};

// 停用所有开发中的功能：开启=一键关闭该分组全部选项；关闭=恢复默认设置
const devFeaturesDisabled = computed(
  () => !backgroundBlur.value && !pwaCacheEnabled.value && !imageWebpEnabled.value,
);
const disableAllDevFeatures = () => {
  backgroundBlur.value = false;
  pwaCacheEnabled.value = false;
  imageWebpEnabled.value = false;
  if (typeof $message !== "undefined") {
    $message.success("已停用所有开发中的功能");
  }
};
const restoreDefaultDevFeatures = () => {
  // 恢复 store/index.js 中的默认值
  backgroundBlur.value = false;
  pwaCacheEnabled.value = true;
  pwaCacheLimit.value = 100;
  imageWebpEnabled.value = false;
  if (typeof $message !== "undefined") {
    $message.success("开发中的功能已恢复默认设置");
  }
};
// 主题颜色设置展开状态
const themeColorExpanded = ref(false);
// 开发模式选项展开状态（已移至 store 持久化）
// 关闭开发模式确认提示
const closeDevModeConfirmVisible = ref(false);
const themeColorList = [
  { value: "pink", label: "泠粉" },
  { value: "purple", label: "幻紫" },
  { value: "blue", label: "栈蓝" },
  { value: "red", label: "火红" },
  { value: "green", label: "春绿" },
  { value: "gray", label: "失灰" },
];
// 字体大小调整状态
const fontSizeEditing = ref(false);
const fontSizeWarnVisible = ref(false);
const removeAnimationsWarnVisible = ref(false);
const advancedSettingsExpanded = ref(false);
const showMoreSettingsWarnVisible = ref(false);

// 开发模式入口方法
// 10 秒内点击 10 次「更多字体」按钮展示开发模式入口（入口显示在分支策略合并菜单内）
const devModeEntryClickTimestamps = ref([]);
const DEV_MODE_ENTRY_CLICKS = 10;
const DEV_MODE_ENTRY_CLICK_WINDOW = 10000;
// 入口展示后 10 秒无操作自动隐藏
const devModeEntryHideTimer = ref(null);
const DEV_MODE_ENTRY_IDLE_TIMEOUT = 10000;

const resetDevModeEntryTimer = () => {
  if (devModeEntryHideTimer.value) clearTimeout(devModeEntryHideTimer.value);
  if (!devModeEntryVisible.value) return;
  devModeEntryHideTimer.value = setTimeout(() => {
    // 无操作自动隐藏入口（不开启开发模式）
    devModeEntryVisible.value = false;
    devModeEntryStep.value = 0;
    devModeEntryInput.value = "";
    devModeEntryError.value = false;
    devModeEntrySuccess.value = false;
    devModeEntryHideTimer.value = null;
  }, DEV_MODE_ENTRY_IDLE_TIMEOUT);
};

const handleMoreFontsClick = () => {
  moreFontsExpanded.value = !moreFontsExpanded.value;
  if (store.devMode === 2) return;

  const now = Date.now();
  devModeEntryClickTimestamps.value = devModeEntryClickTimestamps.value.filter(
    (ts) => now - ts < DEV_MODE_ENTRY_CLICK_WINDOW,
  );
  devModeEntryClickTimestamps.value.push(now);

  if (devModeEntryClickTimestamps.value.length >= DEV_MODE_ENTRY_CLICKS) {
    devModeEntryClickTimestamps.value = [];
    devModeEntryVisible.value = true;
    devModeEntryStep.value = 0;
    devModeEntryError.value = false;
    devModeEntrySuccess.value = false;
    devModeEntryInput.value = "";
    // 入口在分支策略合并菜单内，展开该菜单
    branchStrategyExpanded.value = true;
    resetDevModeEntryTimer();
  }
};

const devModeEntryVerify = () => {
  if (devModeEntryInput.value === "devyes") {
    devModeEntrySuccess.value = true;
    devModeEntryError.value = false;
    // 成功后等用户点「确定」，不再自动隐藏
    if (devModeEntryHideTimer.value) {
      clearTimeout(devModeEntryHideTimer.value);
      devModeEntryHideTimer.value = null;
    }
  } else {
    devModeEntryError.value = true;
    devModeEntryInput.value = "";
    // 失败提示保留 10 秒后自动收起
    resetDevModeEntryTimer();
  }
};

const devModeEntryClose = async () => {
  if (devModeEntryHideTimer.value) {
    clearTimeout(devModeEntryHideTimer.value);
    devModeEntryHideTimer.value = null;
  }
  if (devModeEntrySuccess.value) {
    store.devMode = 2;
    // 启用开发模式时默认开启「展开所有设置分组」
    expandAllGroups.value = true;
    applyExpandAllGroups();
    await saveStoreDefaults({
      siteVersion: siteVersion.value,
      siteVersionDate: siteVersionDate.value,
      branchVersion: branchVersion.value,
      branchBuildTime: branchBuildTime.value,
      DEFAULT_DEV_MODE: 2,
      bumpVersion: true,
    });
    if (typeof $message !== "undefined") {
      $message.success("开发模式已启用");
    }
  }
  devModeEntryVisible.value = false;
  devModeEntryClickTimestamps.value = [];
  devModeEntryStep.value = 0;
  devModeEntryInput.value = "";
  devModeEntryError.value = false;
  devModeEntrySuccess.value = false;
};

const resetFontSize = () => {
  store.fontSize = 17;
  if (typeof document !== "undefined") {
    document.documentElement.style.fontSize = "17px";
  }
};
const cancelFontSizeEdit = () => {
  resetFontSize();
  fontSizeEditing.value = false;
  store.fontSizePending = false;
};
const confirmFontSizeEdit = () => {
  fontSizeEditing.value = false;
  store.fontSizePending = false;
  if (typeof $message !== "undefined") {
    $message.success(
      `全站字体大小已修改为 <span style="color: var(--main-color-blue)">${fontSize.value}</span>`,
      { html: true },
    );
  }
};
// 恢复默认配置

// 写入 store/index.js 默认值
const saveStoreDefaults = async (data) => {
  try {
    const res = await fetch("/api/theme-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error("Save failed:", json.error);
      $message.warning(`保存失败：${json.error || "格式不合法"}`);
    }
  } catch (e) {
    console.error("Failed to save store defaults:", e);
  }
};

// 切换天气定位方式
const switchLocationMode = (mode, label) => {
  weatherLocationMode.value = mode;
  window.dispatchEvent(new Event("weather-refresh"));
  if (typeof $message !== "undefined") {
    $message.success(`天气定位方式已切换为 ${label}`);
  }
};

// 切换天气数据提供商
const switchWeatherProvider = (provider) => {
  weatherProvider.value = provider;
  window.dispatchEvent(new Event("weather-refresh"));
  if (typeof $message !== "undefined") {
    $message.success("已切换天气数据源");
  }
};

// 关闭开发模式（写回 store/index.js 默认值；版本号/构建时间由开发模式选项手动维护）
const confirmCloseDevMode = async () => {
  store.devMode = 1;
  await saveStoreDefaults({
    DEFAULT_DEV_MODE: 1,
    bumpVersion: true,
  });
  closeDevModeConfirmVisible.value = false;
  if (typeof $message !== "undefined") {
    $message.warning("已关闭开发模式");
  }
};

// 自动获取当前时间填入内部版本构建时间
const autoFillBranchBuildTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  branchBuildTime.value = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

// 保存版本信息（站点版本 / 日期 / 内部版本 / 构建时间，一次写入）
const confirmAllVersionFields = async () => {
  const num = parseInt(String(branchVersion.value).replace(/[^\d]/g, ""), 10);
  if (Number.isNaN(num)) {
    if (typeof $message !== "undefined") {
      $message.error("内部版本需为数字");
    }
    return;
  }
  branchVersion.value = num;
  await saveStoreDefaults({
    siteVersion: siteVersion.value,
    siteVersionDate: siteVersionDate.value,
    branchVersion: num,
    branchBuildTime: branchBuildTime.value,
    bumpVersion: true,
  });
  if (typeof $message !== "undefined") {
    $message.success("版本信息已保存");
  }
};

// 将 DEFAULT_DEV_MODE 写回为随机数
const randomizeDefaultDevMode = async () => {
  const random = Math.floor(Math.random() * 1000000);
  await saveStoreDefaults({ DEFAULT_DEV_MODE: random, bumpVersion: true });
  if (typeof $message !== "undefined") {
    $message.success(`DEFAULT_DEV_MODE 已设为随机数 ${random}`);
  }
};

// 清除数据但保留开发模式选项
const handleClearDataKeepDevMode = async () => {
  if (typeof $message !== "undefined") {
    $message.warning("数据已清除，页面即将刷新");
  }
  const dev = store.devMode;
  const savedData = {
    siteVersion: siteVersion.value,
    siteVersionDate: siteVersionDate.value,
    branchVersion: branchVersion.value,
    branchBuildTime: branchBuildTime.value,
  };
  const savedVersion = localStorage.getItem("siteDataVersion");
  await saveStoreDefaults({
    siteVersion: siteVersion.value,
    siteVersionDate: siteVersionDate.value,
    branchVersion: branchVersion.value,
    branchBuildTime: branchBuildTime.value,
    DEFAULT_DEV_MODE: dev,
    bumpVersion: true,
  });

  // 清除 localStorage 和 sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // 注销所有 Service Worker
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }

  // 清除所有 Cache API 缓存
  if ("caches" in window) {
    const names = await caches.keys();
    for (const name of names) {
      await caches.delete(name);
    }
  }

  // 清除所有 IndexedDB
  if ("indexedDB" in window) {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  }

  // 恢复保留的数据
  localStorage.setItem("siteData", JSON.stringify(savedData));
  if (savedVersion) localStorage.setItem("siteDataVersion", savedVersion);
  window.location.reload();
};

// 恢复默认配置
const showResetConfirm = ref(false);
const resetWarnRef = ref(null);
const scrollToResetWarn = () => {
  nextTick(() => {
    resetWarnRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};
const handleResetConfig = async () => {
  showResetConfirm.value = false;
  if (typeof $message !== "undefined") {
    $message.warning("配置已恢复默认，页面即将刷新");
  }
  const dev = store.devMode;
  const savedData = {
    siteVersion: siteVersion.value,
    siteVersionDate: siteVersionDate.value,
    branchVersion: branchVersion.value,
    branchBuildTime: branchBuildTime.value,
  };
  const savedVersion = localStorage.getItem("siteDataVersion");
  await saveStoreDefaults({
    siteVersion: siteVersion.value,
    siteVersionDate: siteVersionDate.value,
    branchVersion: branchVersion.value,
    branchBuildTime: branchBuildTime.value,
    DEFAULT_DEV_MODE: dev,
    bumpVersion: true,
  });
  // 清空 localStorage 和 sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  // 注销所有 Service Worker
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }
  // 清除所有 Cache API 缓存
  if ("caches" in window) {
    const names = await caches.keys();
    for (const name of names) {
      await caches.delete(name);
    }
  }
  // 清除所有 IndexedDB
  if ("indexedDB" in window) {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  }
  localStorage.setItem("siteData", JSON.stringify(savedData));
  if (savedVersion) localStorage.setItem("siteDataVersion", savedVersion);
  window.location.reload();
};

// 显示恢复默认配置警告
const showResetWarning = () => {
  if (typeof $message !== "undefined") {
    $message.warning("即将恢复默认配置，请再次确认");
  }
};

// 设置首页Banner高度
const setBannerType = (type) => {
  bannerType.value = type;
  if (typeof $message !== "undefined") {
    $message.success(`首页Banner高度已切换为${type === "half" ? "半屏" : "全屏"}`);
  }
};

// 设置全站背景
const setBackgroundType = (type) => {
  backgroundType.value = type;
  if (type === "image") {
    themeType.value = "dark";
  }
  const typeNames = { close: "关闭", patterns: "纹理", image: "自定义图片" };
  if (typeof $message !== "undefined") {
    $message.success(`全站背景已切换为${typeNames[type]}`);
  }
};

// 设置主题颜色
const setThemeColor = (color) => {
  store.changeThemeColor(color);
};

// 设置高对比度模式
const setHighContrast = (enabled) => {
  // 记录开启前的自定义主题色状态
  if (enabled === "max" && !customThemeBeforeHighContrast.value) {
    customThemeBeforeHighContrast.value = customThemeEnabled.value;
  }
  highContrast.value = enabled;
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("high-contrast", "high-contrast-max");
    if (enabled === "max") {
      document.documentElement.classList.add("high-contrast", "high-contrast-max");
    } else if (enabled) {
      document.documentElement.classList.add("high-contrast");
    }
  }
  // 关闭最高对比度时，恢复之前的自定义主题色状态
  if (enabled === false && customThemeBeforeHighContrast.value) {
    customThemeBeforeHighContrast.value = false;
    toggleCustomTheme(true);
  }
  if (typeof $message !== "undefined") {
    const labels = { false: "关闭", true: "开启", max: "最高" };
    $message.success(`已切换高对比度模式为：${labels[String(enabled)]}`, { duration: 3000 });
  }
};

// 切换自定义主题色
const toggleCustomTheme = (enabled) => {
  if (enabled) {
    // 开启自定义主题色
    customThemeEnabled.value = true;
    // 保存当前颜色作为上次的值
    lastCustomPrimaryColor.value = customPrimaryColor.value;
    lastCustomSecondaryColor.value = customSecondaryColor.value;
    // 应用自定义颜色
    store.applyCustomThemeColor(customPrimaryColor.value, customSecondaryColor.value);
  } else {
    // 关闭自定义主题色
    customThemeEnabled.value = false;
    // 恢复上次选择的主题色
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      // 清除自定义颜色
      html.style.removeProperty("--main-color");
      html.style.removeProperty("--main-color-bg");
      html.style.removeProperty("--main-accent");
      html.style.removeProperty("--main-accent-bg");
    }
    // 恢复默认主题色
    store.changeThemeColor(themeColor.value);
  }
};

// 撤销自定义主题色
const revertCustomTheme = () => {
  customPrimaryColor.value = lastCustomPrimaryColor.value;
  customSecondaryColor.value = lastCustomSecondaryColor.value;
  if (typeof $message !== "undefined") {
    $message.success("已撤销自定义主题色", { duration: 3000 });
  }
};

// 应用自定义主题色
const applyCustomTheme = () => {
  // 保存当前颜色作为上次的值
  lastCustomPrimaryColor.value = customPrimaryColor.value;
  lastCustomSecondaryColor.value = customSecondaryColor.value;
  // 应用自定义颜色
  store.applyCustomThemeColor(customPrimaryColor.value, customSecondaryColor.value);
};

// 移除动画
const setRemoveAnimations = (enabled) => {
  removeAnimations.value = enabled;
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("remove-animations", enabled);
  }
  if (typeof $message !== "undefined") {
    $message.success(`已${enabled ? "开启" : "关闭"}移除动画`);
  }
};

// 定时切换明暗显示外观
const toggleScheduledTheme = (enabled) => {
  scheduledThemeEnabled.value = enabled;
  if (enabled) {
    store.startScheduledTheme();
    if (typeof $message !== "undefined") {
      $message.success("显示外观已切换为定时切换");
    }
  } else {
    store.stopScheduledTheme();
    themeType.value = "auto";
    store.updateActualThemeValue();
    if (typeof $message !== "undefined") {
      $message.success("显示外观已切换为跟随系统");
    }
  }
};

const onScheduledTimeChange = () => {
  if (scheduledThemeEnabled.value) {
    store.startScheduledTheme();
  }
};

const applyRemoveAnimations = () => {
  removeAnimationsWarnVisible.value = false;
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("remove-animations");
  }
  if (typeof $message !== "undefined") {
    $message.success("已开启移除动画");
  }
};

// 设置显示外观
const setThemeType = (type) => {
  // 如果正在使用定时切换，关闭它
  if (scheduledThemeEnabled.value) {
    scheduledThemeEnabled.value = false;
    store.stopScheduledTheme();
  }
  themeType.value = type;
  const typeNames = { auto: "跟随系统", dark: "深色", light: "浅色" };
  if (typeof $message !== "undefined") {
    $message.success(`显示外观已切换为${typeNames[type]}`);
  }
};

// 设置全站字体
const setFontFamily = (font) => {
  fontFamily.value = font;
  const fontNames = {
    vsans: "vivo Sans",
    hmos: "HarmonyOS Sans",
    xlfont: "小赖字体",
    misans: "MiSans",
    browserfont: "浏览器字体",
  };
  if (typeof $message !== "undefined") {
    $message.success(`全站字体已切换为${fontNames[font]}`);
  }
};

// 设置额外信息显示位置
const setInfoPosition = (position) => {
  infoPosition.value = position;
  if (typeof $message !== "undefined") {
    $message.success(`额外信息显示位置已切换为${position === "normal" ? "默认位置" : "右下角"}`);
  }
};

// 设置自定义右键菜单
const setRightMenu = (enabled) => {
  useRightMenu.value = enabled;
  if (typeof $message !== "undefined") {
    $message.success(`已${enabled ? "开启" : "关闭"}自定义右键菜单`);
  }
};

// 设置自定义光标样式
const setCustomCursor = (enabled) => {
  useCustomCursor.value = enabled;
  store.toggleCustomCursor();
  if (typeof $message !== "undefined") {
    $message.success(`已${enabled ? "开启" : "关闭"}自定义光标样式`);
  }
};

// 设置显示更多选项
const setShowMoreSettings = (show) => {
  if (!show) {
    // 关闭时恢复默认设置并显示消息
    showMoreSettings.value = false;
    showMoreSettingsConfirmed.value = false;
    showMoreSettingsWarnVisible.value = false;
    resetFontSize();
    fontSizeEditing.value = false;
    store.fontSizePending = false;
    if (typeof $message !== "undefined") {
      $message.warning("已隐藏更多选项，并恢复默认配置");
    }
  } else {
    showMoreSettings.value = true;
    showMoreSettingsWarnVisible.value = true;
    scrollToWarn();
  }
};

// 确认显示更多选项
const confirmShowMoreSettings = () => {
  showMoreSettingsConfirmed.value = true;
  showMoreSettingsWarnVisible.value = false;
  if (typeof $message !== "undefined") {
    $message.warning("已显示更多选项");
  }
};

// 获取消息样式名称
const getMessageStyleName = (style) => {
  const names = { bar: "传统", card: "卡片", island: "超级岛" };
  return names[style] || style;
};

// 获取超级岛模式名称
const getIslandModeName = (mode) => {
  const names = { dynamic: "灵动", extended: "拓展" };
  return names[mode] || mode;
};

// 获取消息位置名称
const getMessagePositionName = (position) => {
  const names = {
    "bar-top": "顶部",
    "bar-bottom": "底部",
    "left-top": "左上",
    "left-bottom": "左下",
    "right-top": "右上",
    "right-bottom": "右下",
    "top-center": "顶部居中",
    "bottom-center": "底部居中",
  };
  return names[position] || position;
};

// 获取进度条方向名称
const getProgressDirectionName = (direction) => {
  const names = { normal: "正向", reverse: "逆向", decorative: "装饰", disabled: "关闭" };
  return names[direction] || direction;
};

// 获取显示时间名称
const getMessageDurationName = (duration) => {
  const names = { 1000: "1秒", 2000: "2秒", 3000: "3秒", 5000: "5秒", 0: "手动关闭" };
  return names[duration] || `${duration / 1000}秒`;
};

// 显示消息设置成功消息
const showMessageSettingsSuccess = () => {
  if (typeof $message !== "undefined") {
    const islandModeText =
      messageStyle.value === "island" ? ` ${getIslandModeName(islandMode.value)}` : "";
    $message.success(
      `消息样式已切换为 ${getMessageStyleName(messageStyle.value)}${islandModeText} ${getMessagePositionName(messagePosition.value)} ${getProgressDirectionName(progressDirection.value)} ${getMessageDurationName(messageDuration.value)}`,
    );
  }
};

// 设置消息样式
const setMessageStyle = (style) => {
  messageStyle.value = style;
  // 超级岛样式强制顶部居中
  if (style === "island") {
    messagePosition.value = "top-center";
  }
  showMessageSettingsSuccess();
};

// 设置消息位置
const setMessagePosition = (position) => {
  messagePosition.value = position;
  showMessageSettingsSuccess();
};

// 设置进度条方向
const setProgressDirection = (direction) => {
  progressDirection.value = direction;
  showMessageSettingsSuccess();
};

// 设置显示时间
const setMessageDuration = (duration) => {
  messageDuration.value = duration;
  showMessageSettingsSuccess();
};

// 设置超级岛模式
const setIslandMode = (mode) => {
  islandMode.value = mode;
  showMessageSettingsSuccess();
};

// 设置超级岛使用主题色
const setIslandUseThemeColor = (value) => {
  islandUseThemeColor.value = value;
  if (typeof $message !== "undefined") {
    $message.success(`超级岛使用主题色已${value ? "开启" : "关闭"}`);
  }
};

// 设置超级岛时间读秒
const setIslandShowSeconds = (value) => {
  islandShowSeconds.value = value;
  if (typeof $message !== "undefined") {
    $message.success(`超级岛时间读秒已${value ? "开启" : "关闭"}`);
  }
};

// 设置超级岛显示日期
const setIslandShowDate = (value) => {
  islandShowDate.value = value;
  if (typeof $message !== "undefined") {
    $message.success(`超级岛显示日期已${value ? "开启" : "关闭"}`);
  }
};

// 发送测试消息
const sendTestMessage = (type = "info") => {
  if (typeof $message !== "undefined") {
    const isCard = messageStyle.value === "card";
    const isIsland = messageStyle.value === "island";
    $message[type](
      `测试消息 | 当前设置 ${getMessageStyleName(messageStyle.value)} ${getMessagePositionName(messagePosition.value)} ${getProgressDirectionName(progressDirection.value)} ${getMessageDurationName(messageDuration.value)}`,
      { card: isCard, island: isIsland },
    );
  }
};

// 打开设置面板时，如果"显示更多选项"未确认则重置为关闭
// 移动端自动修正卡片消息位置为居中底部
const normalizeMobilePosition = () => {
  const cornerPositions = ["left-top", "left-bottom", "right-top", "right-bottom"];
  if (cornerPositions.includes(messagePosition.value)) {
    messagePosition.value = "top-center";
  }
};

// 桌面端自动修正卡片消息位置为左下
const normalizeDesktopPosition = () => {
  const centerPositions = ["top-center", "bottom-center"];
  if (centerPositions.includes(messagePosition.value)) {
    messagePosition.value = "left-bottom";
  }
};

// 页面布局变化时自动切换消息样式
watch(
  () => siteLayout.value,
  (val) => {
    siteLayoutDisplay.value = val;
    if (val === "pc") {
      messageStyle.value = "island";
      normalizeDesktopPosition();
    } else if (val === "mobile") {
      messageStyle.value = "island";
      normalizeMobilePosition();
    }
  },
);

// 监听窗口大小变化，auto 模式下自动切换消息样式
let resizeTimer = null;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // 更新窗口宽度
    store.windowWidth = window.innerWidth;
    if (siteLayout.value !== "auto") return;
    if (window.innerWidth <= 768) {
      normalizeMobilePosition();
    } else {
      normalizeDesktopPosition();
    }
    // 更新上次布局记录
    lastSiteLayout.value = "auto";
  }, 300);
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  // 页面加载时判断布局是否发生变化，如果变化则更新消息样式
  updateMessageStyleByLayout();
  // 如果定时切换已启用，启动定时器
  if (scheduledThemeEnabled.value) {
    store.startScheduledTheme();
  }
});

// 根据页面布局更新消息样式
const updateMessageStyleByLayout = () => {
  const currentLayout = siteLayout.value;
  // 如果布局发生了变化，更新消息样式为对应的默认值
  if (currentLayout !== lastSiteLayout.value) {
    if (currentLayout === "pc") {
      messageStyle.value = "island";
      normalizeDesktopPosition();
    } else if (currentLayout === "mobile") {
      messageStyle.value = "island";
      normalizeMobilePosition();
    }
    // 更新上次布局记录
    lastSiteLayout.value = currentLayout;
  }
  // 如果布局没有变化，保持先前的设置
};

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  clearTimeout(resizeTimer);
  if (devModeEntryHideTimer.value) {
    clearTimeout(devModeEntryHideTimer.value);
    devModeEntryHideTimer.value = null;
  }
});

// 切换消息样式时重置位置
watch(
  () => messageStyle.value,
  (val) => {
    if (val === "bar") {
      messagePosition.value = "bar-top";
    } else if (val === "island") {
      messagePosition.value = "top-center";
    } else {
      messagePosition.value = "left-bottom";
    }
    progressDirection.value = "normal";
  },
);

watch(
  () => store.showSettings,
  (val) => {
    if (val) {
      // 打开设置时重置合并菜单状态
      messageSettingsExpanded.value = false;
      moreFontsExpanded.value = false;
      islandSettingsExpanded.value = false;
      themeColorExpanded.value = false;
      musicPlayerExpanded.value = false;
      playerCustomIdsInput.value = playerCustomIds.value;
      closeDevModeConfirmVisible.value = false;
      // 重置开发模式入口状态
      if (devModeEntryHideTimer.value) {
        clearTimeout(devModeEntryHideTimer.value);
        devModeEntryHideTimer.value = null;
      }
      devModeEntryVisible.value = false;
      devModeEntryStep.value = 0;
      devModeEntryInput.value = "";
      devModeEntryError.value = false;
      devModeEntrySuccess.value = false;
      devModeEntryClickTimestamps.value = [];
      layoutWarnVisible.value = false;
      fontSizeEditing.value = false;
      fontSizeWarnVisible.value = false;
      removeAnimationsWarnVisible.value = false;
      showMoreSettingsWarnVisible.value = false;
      importConfirmVisible.value = false;
      if (showMoreSettings.value && !showMoreSettingsConfirmed.value) {
        showMoreSettings.value = false;
      }
      // 若已开启「展开所有设置分组」，重新展开所有分组
      if (expandAllGroups.value) {
        applyExpandAllGroups();
      }
    }
    if (!val) {
      showResetConfirm.value = false;
      importConfirmVisible.value = false;
      // 关闭设置面板时，如果字体大小被修改过，恢复默认
      if (fontSizeEditing.value) {
        resetFontSize();
        fontSizeEditing.value = false;
        store.fontSizePending = false;
        if (typeof $message !== "undefined") {
          $message.warning("字体大小未确认，已恢复为默认大小");
        }
      }
      if (siteLayoutPending.value) {
        siteLayout.value = "auto";
        siteLayoutPending.value = false;
        layoutConfirmVisible.value = false;
        clearLayoutCountdown();
        if (typeof $message !== "undefined") {
          $message.warning("选择的布局未确认，已恢复为自动选择");
        }
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.set-list {
  .title {
    display: block;
    width: 100%;
    margin: 1rem 0;
    font-size: 16px;
    font-weight: bold;
    border-left: 4px solid var(--main-color);
    border-radius: 4px 8px 8px 4px;
    background-color: var(--main-border-shadow);
    padding: 6px 0 6px 12px;
    &:first-child {
      margin-top: 0;
    }
  }
  .set-desc {
    display: block;
    font-size: 13px;
    color: var(--main-font-color);
    opacity: 0.6;
    margin: -4px 0 12px;
  }
  .about-version-pill {
    display: inline-flex;
    align-items: center;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--main-color);
    background-color: var(--main-color-bg);
    border-radius: 8px;
    padding: 6px 20px;
    letter-spacing: 0.5px;
  }
  .set-label-channel {
    color: var(--main-color);
  }
  .set-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    .set-options {
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 40px;
      border-radius: 8px;
      .options {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9375rem;
        border-radius: 8px;
        margin: 4px 8px;
        padding: 6px 8px;
        min-width: 30px;
        background-color: var(--main-card-border);
        transition:
          color 0.3s,
          background-color 0.3s,
          box-shadow var(--press-out) var(--press-ease),
          transform var(--press-out) var(--press-ease);
        &.choose,
        &:hover {
          color: var(--main-card-background);
          background-color: var(--main-color);
          box-shadow: 0 8px 16px -4px var(--main-border-shadow);
        }
        &:active {
          color: var(--main-card-background);
          background-color: var(--main-color);
          box-shadow: 0 8px 16px -4px var(--main-border-shadow);
          transform: scale(0.95);
          transition-duration: var(--press-in);
        }
        &.reset-btn:hover {
          background-color: var(--main-error-color);
        }
        &.reset-btn:active {
          background-color: var(--main-error-color);
          transition-duration: var(--press-in);
        }
        &:last-child {
          margin-right: 0;
        }
      }
      .num {
        margin: 0 4px;
      }
      input {
        border: none;
        outline: none;
        border-radius: 8px;
        color: var(--main-font-color);
        font-family: var(--main-font-family);
        background-color: var(--main-border-shadow);
        height: 100%;
        padding: 0 1rem;
        font-size: 14px;
      }
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
  .set-expand-box {
    border: none;
    border-left: 4px solid var(--main-color);
    border-radius: 0;
    padding: 0 0 0 16px;
    margin-bottom: 12px;
    .set-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      min-height: 40px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .set-item-channel {
      flex-direction: column;
      align-items: flex-start;
      min-height: auto;
      .set-label {
        margin-bottom: 4px;
      }
      .set-desc {
        margin-top: 4px;
      }
    }
  }
  .set-warn {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    transition: transform var(--press-out) var(--press-ease);
    // 只有整块可点的警告面板给按下反馈，纯提示类的排除掉
    &:not(.set-warn-red):not(.set-warn-static):active {
      transform: scale(0.98);
      transition-duration: var(--press-in);
    }
    .warn-text {
      font-size: 14px;
      color: #dc2626;
    }
    .options {
      flex-shrink: 0;
      color: #dc2626;
      background-color: transparent;
      transition:
        color var(--press-out) var(--press-ease),
        background-color var(--press-out) var(--press-ease),
        box-shadow var(--press-out) var(--press-ease),
        transform var(--press-out) var(--press-ease);
      &:hover {
        color: #b91c1c;
        background-color: transparent;
        box-shadow: none;
      }
      &:active {
        color: #b91c1c;
        background-color: transparent;
        box-shadow: none;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
  }
  .devmode-entry-input {
    padding: 6px 10px;
    border: 1px solid var(--main-card-border);
    border-radius: 8px;
    font-size: 0.9375rem;
    background-color: var(--main-card-background);
    color: var(--main-font-color);
    outline: none;
    min-width: 140px;
    margin: 4px 8px;
    &:focus {
      border-color: var(--main-color);
    }
  }
  .devmode-yes-btn {
    background-color: var(--main-error-color) !important;
    color: #fff !important;
    transition: background-color var(--press-out) var(--press-ease);
    &:hover {
      background-color: color-mix(in srgb, var(--main-error-color) 80%, #000) !important;
    }
    &:active {
      background-color: color-mix(in srgb, var(--main-error-color) 80%, #000) !important;
      transition-duration: var(--press-in);
    }
  }
  .set-warn-purple {
    flex-direction: column;
    align-items: stretch;
    background-color: #f5f3ff;
    border-color: #c4b5fd;
    cursor: pointer;
    transition: transform var(--press-out) var(--press-ease);
    &:active {
      transform: scale(0.98);
      transition-duration: var(--press-in);
    }
    .warn-text {
      color: #7c3aed;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 6px;
    }
    .warn-countdown {
      font-size: 13px;
      color: #7c3aed;
      opacity: 0.8;
      text-align: center;
      margin-bottom: 10px;
    }
    .warn-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .warn-no {
      color: #7c3aed;
      border: 1px solid #7c3aed;
      border-radius: 8px;
      padding: 6px 12px;
      background-color: transparent;
      transition:
        color var(--press-out) var(--press-ease),
        border-color var(--press-out) var(--press-ease),
        background-color var(--press-out) var(--press-ease),
        box-shadow var(--press-out) var(--press-ease),
        transform var(--press-out) var(--press-ease);
      &:hover {
        color: #6d28d9;
        border-color: #6d28d9;
        background-color: transparent;
        box-shadow: none;
      }
      &:active {
        color: #6d28d9;
        border-color: #6d28d9;
        background-color: transparent;
        box-shadow: none;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    .warn-yes {
      color: #fff !important;
      background-color: #7c3aed !important;
      border-radius: 8px;
      padding: 6px 12px;
      transition:
        background-color var(--press-out) var(--press-ease),
        transform var(--press-out) var(--press-ease);
      &:hover {
        background-color: #6d28d9 !important;
      }
      &:active {
        background-color: #6d28d9 !important;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
  }
  .set-warn-red {
    flex-direction: column;
    align-items: stretch;
    background-color: #fef2f2;
    border-color: #fca5a5;
    .warn-text {
      color: #dc2626;
      font-size: 14px;
      text-align: center;
      margin-bottom: 6px;
    }
    .warn-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .warn-no {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9375rem;
      color: #dc2626;
      border: 1px solid #dc2626;
      border-radius: 8px;
      padding: 6px 8px;
      min-width: 30px;
      background-color: transparent;
      transition:
        color 0.3s,
        background-color 0.3s,
        border-color var(--press-out) var(--press-ease),
        box-shadow var(--press-out) var(--press-ease),
        transform var(--press-out) var(--press-ease);
      &:hover {
        color: #b91c1c;
        border-color: #b91c1c;
        background-color: transparent;
        box-shadow: none;
      }
      &:active {
        color: #b91c1c;
        border-color: #b91c1c;
        background-color: transparent;
        box-shadow: none;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
    .warn-yes {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9375rem;
      color: #fff !important;
      background-color: #dc2626 !important;
      border-radius: 8px;
      padding: 6px 8px;
      min-width: 30px;
      transition:
        color 0.3s,
        background-color 0.3s,
        transform var(--press-out) var(--press-ease);
      &:hover {
        background-color: #b91c1c !important;
      }
      &:active {
        background-color: #b91c1c !important;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
  }
  .set-warn-purple-import {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    background-color: #f5f3ff;
    border: 1px solid #c4b5fd;
    transition: transform var(--press-out) var(--press-ease);
    &:active {
      transform: scale(0.98);
      transition-duration: var(--press-in);
    }
    .warn-text {
      font-size: 14px;
      color: #7c3aed;
    }
    .options {
      flex-shrink: 0;
      color: #7c3aed;
      background-color: transparent;
      transition:
        color var(--press-out) var(--press-ease),
        background-color var(--press-out) var(--press-ease),
        box-shadow var(--press-out) var(--press-ease),
        transform var(--press-out) var(--press-ease);
      &:hover {
        color: #6d28d9;
        background-color: transparent;
        box-shadow: none;
      }
      &:active {
        color: #6d28d9;
        background-color: transparent;
        box-shadow: none;
        transform: scale(0.95);
        transition-duration: var(--press-in);
      }
    }
  }
  .color-input-hidden {
    position: absolute;
    width: 0;
    height: 0;
    padding: 0;
    border: none;
    opacity: 0;
    pointer-events: none;
  }
  .color-preview {
    width: 24px;
    height: 24px;
    border: 1px solid var(--main-card-border);
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      border-color 0.3s,
      transform var(--press-out) var(--press-ease);
    &:hover {
      border-color: var(--main-color);
    }
    &:active {
      transform: scale(0.98);
      transition-duration: var(--press-in);
    }
  }
  .text-input {
    width: 110px;
    height: 24px;
    border: 1px solid var(--main-card-border);
    border-radius: 6px;
    padding: 0 8px;
    font-size: 14px;
    font-family: var(--main-font-family);
    color: var(--main-font-color);
    background-color: var(--main-card-background);
    margin-left: 8px;
    box-sizing: border-box;
    &:focus {
      outline: none;
      border-color: var(--main-color);
    }
  }
  .time-input {
    border: 1px solid var(--main-card-border);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    font-family: var(--main-font-family);
    color: var(--main-font-color);
    background-color: var(--main-card-background);
    cursor: pointer;
    &:focus {
      outline: none;
      border-color: var(--main-color);
    }
  }
}
</style>

<style lang="scss">
html.theme-gray .set-warn.set-warn-purple {
  background-color: #f0f0f0 !important;
  border-color: #cccccc !important;
  .warn-text,
  .warn-countdown {
    color: #666666 !important;
  }
  .warn-no {
    color: #666666 !important;
    border-color: #666666 !important;
  }
  .warn-yes {
    color: #fff !important;
    background-color: #666666 !important;
    &:hover {
      background-color: #555555 !important;
    }
  }
}
html.theme-gray .set-warn.set-warn-red {
  background-color: #f0f0f0 !important;
  border-color: #cccccc !important;
  .warn-text {
    color: #666666 !important;
  }
  .warn-no {
    color: #666666 !important;
    border-color: #666666 !important;
  }
  .warn-yes {
    color: #fff !important;
    background-color: #666666 !important;
    &:hover {
      background-color: #555555 !important;
    }
  }
}
html.theme-gray .set-warn.set-warn-purple-import {
  background-color: #f0f0f0 !important;
  border-color: #cccccc !important;
  .warn-text {
    color: #666666 !important;
  }
  .options {
    color: #666666 !important;
    &:hover {
      color: #555555 !important;
    }
  }
}
html.dark.theme-gray .set-warn.set-warn-purple {
  background-color: #222222 !important;
  border-color: #444444 !important;
  .warn-text,
  .warn-countdown {
    color: #999999 !important;
  }
  .warn-no {
    color: #999999 !important;
    border-color: #999999 !important;
  }
  .warn-yes {
    color: #fff !important;
    background-color: #666666 !important;
    &:hover {
      background-color: #888888 !important;
    }
  }
}
html.dark.theme-gray .set-warn.set-warn-red {
  background-color: #222222 !important;
  border-color: #444444 !important;
  .warn-text {
    color: #999999 !important;
  }
  .warn-no {
    color: #999999 !important;
    border-color: #999999 !important;
  }
  .warn-yes {
    color: #fff !important;
    background-color: #666666 !important;
    &:hover {
      background-color: #888888 !important;
    }
  }
}
html.dark.theme-gray .set-warn.set-warn-purple-import {
  background-color: #222222 !important;
  border-color: #444444 !important;
  .warn-text {
    color: #999999 !important;
  }
  .options {
    color: #999999 !important;
    &:hover {
      color: #888888 !important;
    }
  }
}

// 深色模式 - 警告区域
html.dark .set-list .set-warn {
  background-color: #3b1520;
  border-color: #5c2030;
  .warn-text {
    color: #f87171;
  }
  .options {
    color: #f87171;
    &:hover {
      color: #fca5a5;
    }
  }
}
html.dark .set-list .set-warn.set-warn-purple {
  background-color: #1e1833;
  border-color: #3b2d6b;
  .warn-text {
    color: #a78bfa;
  }
  .warn-countdown {
    color: #a78bfa;
  }
  .warn-no {
    color: #a78bfa;
    border-color: #a78bfa;
    &:hover {
      color: #c4b5fd;
      border-color: #c4b5fd;
      background-color: transparent;
    }
  }
  .warn-yes {
    color: #fff !important;
    background-color: #7c3aed !important;
    &:hover {
      background-color: #6d28d9 !important;
    }
  }
}
html.dark .set-list .set-warn.set-warn-red {
  background-color: #3b1520;
  border-color: #5c2030;
  .warn-text {
    color: #f87171;
  }
  .warn-no {
    color: #f87171;
    border-color: #f87171;
    &:hover {
      color: #fca5a5;
      border-color: #fca5a5;
      background-color: transparent;
    }
  }
  .warn-yes {
    color: #fff !important;
    background-color: #dc2626 !important;
    &:hover {
      background-color: #b91c1c !important;
    }
  }
}
html.dark .set-list .set-warn.set-warn-purple-import {
  background-color: #1e1833;
  border-color: #3b2d6b;
  .warn-text {
    color: #a78bfa;
  }
  .options {
    color: #a78bfa;
    &:hover {
      color: #c4b5fd;
      background-color: transparent;
    }
  }
}

// 最高对比度 - 警告区域黑白
html.high-contrast-max .set-warn {
  background: #ffffff !important;
  border: 2px solid #000000 !important;
  .warn-text,
  .warn-countdown,
  .options {
    color: #000000 !important;
  }
  .warn-no {
    color: #000000 !important;
    border-color: #000000 !important;
    background: transparent !important;
  }
  .warn-yes {
    color: #ffffff !important;
    background: #000000 !important;
    border-color: #000000 !important;
  }
}
html.dark.high-contrast-max .set-warn {
  background: #000000 !important;
  border: 2px solid #ffffff !important;
  .warn-text,
  .warn-countdown,
  .options {
    color: #ffffff !important;
  }
  .warn-no {
    color: #ffffff !important;
    border-color: #ffffff !important;
    background: transparent !important;
  }
  .warn-yes {
    color: #000000 !important;
    background: #ffffff !important;
    border-color: #ffffff !important;
  }
}

// 移除动画
html.remove-animations *,
html.remove-animations *::before,
html.remove-animations *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}
</style>
