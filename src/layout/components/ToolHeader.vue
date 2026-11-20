<script lang="tsx">
import { defineComponent, computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import router from '@/router'
import { Message } from '@/layout/components/Message'
import { Collapse } from '@/layout/components/Collapse'
import { UserInfo } from '@/layout/components/UserInfo'
import { Screenfull } from '@/layout/components/Screenfull'
import { Breadcrumb } from '@/layout/components/Breadcrumb'
import { SizeDropdown } from '@/layout/components/SizeDropdown'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
// import { LayoutSwitcher } from '@/layout/components/LayoutSwitcher'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import RouterSearch from '@/components/RouterSearch/index.vue'
import TenantVisit from '@/layout/components/TenantVisit/index.vue'
import FmsAccountSetSwitch from '@/views/fms/components/account-set/FmsAccountSetSwitch.vue'
import { useSetting } from '@/layout/components/Setting'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { Icon } from '@/components/Icon'
import { checkPermi } from '@/utils/permission'
import { isHorizontalMenuLayout, isMixedNavLayout, isTwoColumnLayout } from '@/utils/layout'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 搜索图片
const search = computed(() => appStore.search)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
const locale = computed(() => appStore.getLocale)

// 消息图标
const message = computed(() => appStore.getMessage)

// IM即时通讯图标
const im = computed(() => appStore.getIm)

// 是否隐藏全局设置入口，仅 VITE_HIDE_GLOBAL_SETTING 为 'true' 时隐藏
const hideSetting = import.meta.env.VITE_HIDE_GLOBAL_SETTING === 'true'

// 是否是移动端
const mobile = computed(() => appStore.getMobile)

// 租户切换权限
const hasTenantVisitPermission = computed(
  () => import.meta.env.VITE_APP_TENANT_ENABLE === 'true' && checkPermi(['system:tenant:visit'])
)

// 顶部聊天入口：用路由 name resolve 出完整 URL，在新标签页打开 IM 主页
// 场景考虑：IM 是全屏沉浸式壳，如果在当前页 push 会把原来在用的后台管理界面挤掉；开新 Tab 更符合用户预期
const goToChat = () => {
  // 用路由 name resolve 出完整 URL，在新标签页打开 IM 主页
  const { href } = router.resolve({ name: 'ImHome' })
  window.open(href, '_blank')
}

export default defineComponent({
  name: 'ToolHeader',
  setup() {
    const { t } = useI18n()
    const { openSetting } = useSetting()
    const showSidebarControl = computed(
      () => !isHorizontalMenuLayout(layout.value) || isMixedNavLayout(layout.value)
    )
    const showBreadcrumb = computed(() => !isHorizontalMenuLayout(layout.value))

    // 暗黑模式快捷入口与设置抽屉共用 ThemeSwitch；全局设置隐藏时或移动端不展示
    const showQuickActions = computed(() => !hideSetting && !mobile.value)

    // 按工具栏实际可用宽度决定是否显示快捷入口：左右两组加上快捷入口放得下才显示，
    // 否则快捷入口移出文档流并隐藏（仍走设置抽屉），不加重已有入口过多时的溢出
    const rootRef = ref<HTMLElement>()
    const leftRef = ref<HTMLElement>()
    const rightRef = ref<HTMLElement>()
    const quickRef = ref<HTMLElement>()
    const quickActionsFit = ref(false)

    // 元素内容不换行、不收缩时的宽度：空间不足时左右两组会被 flex 压缩（如面包屑文字换行），实际宽度会低估所需空间；
    // 临时设置后同步读取并立即恢复，不产生可见变化
    const getContentWidth = (el: HTMLElement) => {
      const { flex, width } = el.style
      el.style.flex = 'none'
      el.style.width = 'max-content'
      const contentWidth = el.getBoundingClientRect().width
      el.style.flex = flex
      el.style.width = width
      return contentWidth
    }

    // 横向菜单“更多”按钮宽度：Element Plus 默认左右 --el-menu-base-level-padding(20px) + 图标 --el-menu-icon-width(24px) = 64px；
    // 实测到更宽时取较大值且只增不减，避免快捷入口显示前后“更多”出现 / 消失导致判断往复
    let moreReserve = 64

    // 弹性兄弟元素需保留的宽度：横向菜单保留左右内边距 + 完整的“更多”按钮，确保菜单增强的“更多”入口始终完整可点；其它取 min-width
    const getSiblingReserve = (sibling: Element, minWidth: number) => {
      const menu = sibling.querySelector('.el-menu--horizontal')
      if (!menu) return minWidth
      const more = menu.querySelector(':scope > .el-sub-menu.el-sub-menu__hide-arrow')
      if (more) moreReserve = Math.max(moreReserve, more.getBoundingClientRect().width)
      const { paddingLeft, paddingRight } = getComputedStyle(sibling)
      return Math.max(minWidth, parseFloat(paddingLeft) + parseFloat(paddingRight) + moreReserve)
    }

    // 工具栏按内容自适应宽度、与弹性横向菜单并排时（header-nav、mixed-nav、header-mixed-nav），自身宽度并非上限：
    // 可再占用同一 flex 行中弹性兄弟元素超出保留宽度的部分（横向菜单 min-width 为 0，放不下的菜单项由 ellipsis 收入“更多”）。
    // 快捷入口显示后工具栏变宽、弹性兄弟等量变窄，二者之和不变，判断不会来回切换；
    // 工具栏自身弹性撑满（flex-1）或父元素非横向 flex（classic 等）时不借用，仍以自身宽度为上限
    const getBorrowableWidth = (root: HTMLElement) => {
      const parent = root.parentElement
      if (!parent) return 0
      const { display, flexDirection } = getComputedStyle(parent)
      if (!display.endsWith('flex') || flexDirection !== 'row') return 0
      if (parseFloat(getComputedStyle(root).flexGrow) > 0) return 0
      let borrowable = 0
      Array.from(parent.children).forEach((sibling) => {
        if (sibling === root) return
        const { flexGrow, minWidth } = getComputedStyle(sibling)
        // min-width 为 auto 等非长度值时无法确定可让出的宽度，不借用
        const min = parseFloat(minWidth)
        if (parseFloat(flexGrow) > 0 && !Number.isNaN(min)) {
          // 有符号累加：弹性兄弟已低于保留宽度时（如快捷入口显示后窗口变窄），差额从可用宽度中扣除，
          // 使快捷入口在“更多”不完整前隐藏；隐藏后工具栏让回的宽度与菜单增加的宽度等量，判断仍不往复
          const reserve = getSiblingReserve(sibling, min)
          borrowable += sibling.getBoundingClientRect().width - reserve
        }
      })
      return borrowable
    }

    const updateQuickActionsFit = () => {
      const root = rootRef.value
      const right = rightRef.value
      const quick = quickRef.value
      if (!root || !right || !quick) return
      const { paddingLeft, paddingRight } = getComputedStyle(root)
      const available =
        root.clientWidth -
        parseFloat(paddingLeft) -
        parseFloat(paddingRight) +
        getBorrowableWidth(root)
      const leftWidth = leftRef.value ? getContentWidth(leftRef.value) : 0
      // 隐藏时快捷入口已移出文档流（不计入右侧宽度），仍可测得自身宽度；显示时从右侧宽度中扣除，
      // 判断结果与当前是否显示无关，不会来回切换
      const quickWidth = getContentWidth(quick)
      const otherRightWidth = getContentWidth(right) - (quickActionsFit.value ? quickWidth : 0)
      // 0.5px 容差：显示前后布局取整的亚像素差异不致改变判断
      quickActionsFit.value = leftWidth + otherRightWidth + quickWidth <= available + 0.5
    }

    // 在下一帧更新，避免在 ResizeObserver 回调中改变被观察元素尺寸导致循环告警
    let frame = 0
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateQuickActionsFit)
    }

    let observer: ResizeObserver | undefined
    const observeToolbar = () => {
      if (!observer) return
      observer.disconnect()
      if (!quickRef.value) {
        quickActionsFit.value = false
        return
      }
      // 观察父元素：工具栏按内容自适应宽度时，窗口缩放只改变父元素与弹性兄弟宽度，工具栏自身尺寸不变
      const targets = [
        rootRef.value?.parentElement ?? undefined,
        rootRef.value,
        leftRef.value,
        rightRef.value,
        quickRef.value
      ]
      targets.forEach((el) => {
        if (el) observer?.observe(el)
      })
    }

    onMounted(() => {
      observer = new ResizeObserver(scheduleUpdate)
      observeToolbar()
    })

    watch([leftRef, rightRef, quickRef], observeToolbar, { flush: 'post' })

    onBeforeUnmount(() => {
      observer?.disconnect()
      observer = undefined
      cancelAnimationFrame(frame)
    })

    return () => (
      <div
        ref={rootRef}
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
          // 暗色底色：默认主题跟随头部色，已保存自定义头部色时为 --el-bg-color（由 app store 内联）
          'dark:bg-[var(--top-tool-dark-bg-color)]'
        ]}
      >
        {showSidebarControl.value || showBreadcrumb.value ? (
          <div ref={leftRef} class="h-full flex items-center">
            {showSidebarControl.value && hamburger.value && !isTwoColumnLayout(layout.value) ? (
              <Collapse class="header-action" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {showBreadcrumb.value && breadcrumb.value ? (
              <Breadcrumb class="lt-md:hidden"></Breadcrumb>
            ) : undefined}
          </div>
        ) : undefined}
        <div ref={rightRef} class="h-full flex items-center">
          <FmsAccountSetSwitch />
          {hasTenantVisitPermission.value ? <TenantVisit /> : undefined}
          {/* 项目配置、IM 入口为原生 button，可键盘聚焦并带可访问名称 */}
          {hideSetting ? undefined : (
            <button
              type="button"
              class={['v-setting header-action', `${prefixCls}__action`]}
              title={t('setting.projectSetting')}
              aria-label={t('setting.projectSetting')}
              onClick={openSetting}
            >
              <Icon color="var(--top-header-text-color)" size={18} icon="ep:setting" />
            </button>
          )}
          {showQuickActions.value ? (
            <div
              ref={quickRef}
              class={[
                'h-full flex items-center',
                { [`${prefixCls}__quick--hidden`]: !quickActionsFit.value }
              ]}
            >
              {/* 布局切换统一从设置抽屉进入
              <LayoutSwitcher
                class="header-action"
                color="var(--top-header-text-color)"
                available={quickActionsFit.value}
              ></LayoutSwitcher>
              */}
              <ThemeSwitch
                modelValue={appStore.getIsDark}
                {...{ 'onUpdate:modelValue': (value: boolean) => appStore.setIsDark(value) }}
                class={['header-action', `${prefixCls}__theme-switch`]}
              ></ThemeSwitch>
            </div>
          ) : undefined}
          {screenfull.value ? (
            <Screenfull class="header-action" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {search.value ? (
            <RouterSearch isModal={false} color="var(--top-header-text-color)" />
          ) : undefined}
          {size.value ? (
            <SizeDropdown class="header-action" color="var(--top-header-text-color)"></SizeDropdown>
          ) : undefined}
          {locale.value ? (
            <LocaleDropdown
              class="header-action"
              color="var(--top-header-text-color)"
            ></LocaleDropdown>
          ) : undefined}
          {message.value ? (
            <Message class="header-action" color="var(--top-header-text-color)"></Message>
          ) : undefined}
          {/* IM 聊天入口 */}
          {im.value ? (
            <button
              type="button"
              class={['header-action', `${prefixCls}__action`]}
              title={t('layout.openChat')}
              aria-label={t('layout.openChat')}
              onClick={goToChat}
            >
              <Icon color="var(--top-header-text-color)" size={18} icon="ep:chat-dot-round" />
            </button>
          ) : undefined}
          <UserInfo></UserInfo>
        </div>
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
  transition: left var(--transition-time-02);

  // ElSwitch 自带高度，撑满工具栏高度以与其它 header-action 操作项的悬停区域一致
  :deep(.#{$prefix-cls}__theme-switch.el-switch) {
    height: 100%;
  }

  // 空间不足时快捷入口移出文档流并隐藏（不可见、不可聚焦、不响应点击），保留自身宽度供测量能否再次显示
  &__quick--hidden {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    visibility: hidden;
  }
}

// :where 不增加优先级，只重置原生 button 默认样式；高度、内边距、hover 仍由 header-action 决定，保留 focus outline
:where(.#{$prefix-cls}__action) {
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
</style>
