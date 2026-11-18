<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { normalizeLayout } from '@/utils/layout'
import type { VbenLayoutType } from '@/types/layout'
import LayoutRadioPicker from '@/layout/components/Setting/src/components/LayoutRadioPicker.vue'

// 顶部工具栏快捷切换页面布局：
// 复用设置抽屉的 6 种布局选项与 appStore.setLayout（含缓存、移动端限制），不引入上游 4 种布局
// 外部属性（如工具栏的 header-action）落到原生触发按钮上，使整个悬停区域都可点击打开弹层
defineOptions({ name: 'LayoutSwitcher', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    color?: string
    // 所在工具栏是否有空间显示本入口；由 ToolHeader 的宽度检测传入，空间不足时入口被隐藏
    available?: boolean
  }>(),
  { color: '', available: true }
)

const { t } = useI18n()

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('layout-switcher')

const appStore = useAppStore()

// 与设置抽屉 LayoutRadioPicker 的文案一致
const layoutLabels: Record<VbenLayoutType, string> = {
  'sidebar-nav': 'setting.vertical',
  'sidebar-mixed-nav': 'setting.twoColumn',
  'header-nav': 'setting.horizontal',
  'header-sidebar-nav': 'setting.headerSidebarNav',
  'mixed-nav': 'setting.mixedMenu',
  'header-mixed-nav': 'setting.headerTwoColumn'
}

const currentLabel = computed(() => t(layoutLabels[normalizeLayout(appStore.getLayout)]))

const visible = ref(false)

const triggerRef = ref<HTMLButtonElement>()

const panelRef = ref<HTMLElement>()

// 弹层打开后焦点移到当前布局选项，键盘可直接 Tab 选择
const focusActiveOption = () => {
  panelRef.value?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus()
}

const close = () => {
  visible.value = false
  triggerRef.value?.focus()
}

const isVisible = (el: HTMLElement | null): el is HTMLElement =>
  !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'

// 选择布局后的焦点恢复：切换到不同渲染模式会重建工具栏，本组件与原触发器随之卸载，焦点落到 body；
// 同一渲染模式复用工具栏时，快捷入口可能在稍后的宽度检测（ResizeObserver → 下一帧）中才被隐藏，焦点同样落到 body。
// 逐帧检查满 RESTORE_FOCUS_MAX_FRAMES 帧后结束（不依赖本实例存活）：
// - 焦点已被用户移到其它控件则立即停止，不抢焦点；
// - 触发器连续 2 帧可见时聚焦它（已在其上则不动），之后继续观察迟到的隐藏；
//   已恢复后触发器仍可见而焦点回到 body，视为用户主动移开，停止；
// - 到期时触发器不可见且焦点丢失（或仍停在已隐藏的触发器上），回到工具栏中可见的项目配置按钮
const RESTORE_FOCUS_MAX_FRAMES = 30
const restoreFocusAfterLayoutChange = () => {
  const toolHeader = `#${variables.namespace}-tool-header`
  const triggerSelector = `${toolHeader} .${prefixCls}__trigger`
  let frames = 0
  let visibleFrames = 0
  let restored = false
  const check = () => {
    const active = document.activeElement
    const focusLost = !active || active === document.body
    const onTrigger = !!active?.matches(triggerSelector)
    if (!focusLost && !onTrigger) return
    const trigger = document.querySelector<HTMLElement>(triggerSelector)
    const triggerVisible = isVisible(trigger)
    if (focusLost && restored && triggerVisible) return
    // 触发器被隐藏后焦点丢失并非用户操作：清除已恢复标记，若稍后重新可见则再次恢复
    if (!triggerVisible) restored = false
    visibleFrames = triggerVisible ? visibleFrames + 1 : 0
    if (visibleFrames >= 2 && isVisible(trigger)) {
      if (active !== trigger) trigger.focus()
      restored = true
    }
    if (++frames >= RESTORE_FOCUS_MAX_FRAMES) {
      if (!triggerVisible) {
        const setting = document.querySelector<HTMLElement>(
          `${toolHeader} button.${variables.namespace}-setting`
        )
        if (isVisible(setting)) setting.focus()
      }
      return
    }
    requestAnimationFrame(check)
  }
  requestAnimationFrame(check)
}

// 点击任一布局选项（含当前布局）后关闭弹层
const onPanelClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement | null)?.closest('button')) {
    close()
    restoreFocusAfterLayoutChange()
  }
}

// 窗口尺寸变化时关闭弹层：工具栏空间不足时触发器会被自动隐藏，避免弹层悬空
useEventListener(window, 'resize', () => {
  visible.value = false
})

// 非窗口尺寸引起的空间不足（如路由切换后面包屑变长）同样会隐藏入口：此时关闭弹层；
// 焦点原在弹层面板或触发器上时回到工具栏中可见的项目配置按钮，焦点在其它控件上则不动。重新有空间时入口照常可用
watch(
  () => props.available,
  (available) => {
    if (available || !visible.value) return
    const active = document.activeElement
    const hadFocus = !!active && (!!panelRef.value?.contains(active) || triggerRef.value === active)
    visible.value = false
    if (!hadFocus) return
    const setting = document.querySelector<HTMLElement>(
      `#${variables.namespace}-tool-header button.${variables.namespace}-setting`
    )
    if (isVisible(setting)) setting.focus()
  }
)
</script>

<template>
  <div :class="prefixCls">
    <!-- role="dialog"：Element Plus 仅在非 tooltip 角色时由触发器输出 aria-expanded / aria-haspopup / aria-controls
         （默认 tooltip 角色会把触发器上自定义的 aria-expanded 合并为空）；title 作为弹层标题并成为对话框的可访问名称 -->
    <ElPopover
      v-model:visible="visible"
      :title="t('layout.layoutTitle')"
      :width="300"
      placement="bottom"
      role="dialog"
      trigger="click"
      @after-enter="focusActiveOption"
    >
      <template #reference>
        <!-- 原生 button 作为触发器，可键盘聚焦并带可访问名称 -->
        <button
          ref="triggerRef"
          v-bind="$attrs"
          :aria-label="t('layout.switchLayout')"
          :class="`${prefixCls}__trigger`"
          :style="{ color }"
          :title="t('layout.switchLayout')"
          type="button"
        >
          <Icon :color="color" :size="18" icon="mdi:view-quilt-outline" />
          <!-- 宽屏显示当前布局名称；较窄桌面只保留图标，避免工具栏拥挤 -->
          <span class="ml-6px text-13px lt-xl:hidden">{{ currentLabel }}</span>
        </button>
      </template>
      <div ref="panelRef" @click="onPanelClick" @keydown.esc.stop="close">
        <div class="mb-12px text-12px text-[var(--el-text-color-secondary)]">
          {{ t('layout.layoutHint') }}
        </div>
        <LayoutRadioPicker />
      </div>
    </ElPopover>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-layout-switcher;

.#{$prefix-cls} {
  display: flex;
  height: 100%;
  align-items: center;
}

// 触发器原生 button：重置默认样式并沿用 flex 居中，保留 focus outline
:where(.#{$prefix-cls}__trigger) {
  display: flex;
  padding: 0;
  font: inherit;
  color: inherit;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  align-items: center;
}
</style>
