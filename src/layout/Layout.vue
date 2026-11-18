<script lang="tsx">
import { computed, defineComponent, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { Backtop } from '@/components/Backtop'
import { Setting } from '@/layout/components/Setting'
import { useRenderLayout } from './components/useRenderLayout'
import { useDesign } from '@/hooks/web/useDesign'
import { getLayoutRenderMode } from '@/utils/layout'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('layout')

const appStore = useAppStore()

// 是否是移动端
const mobile = computed(() => appStore.getMobile)

// 菜单折叠
const collapse = computed(() => appStore.getCollapse)

const layout = computed(() => appStore.getLayout)

// 是否隐藏全局设置，仅 VITE_HIDE_GLOBAL_SETTING 为 'true' 时隐藏
const hideSetting = import.meta.env.VITE_HIDE_GLOBAL_SETTING === 'true'

const handleClickOutside = () => {
  appStore.setCollapse(true)
}

const renderLayout = () => {
  const { renderClassic, renderTopLeft, renderTop, renderCutMenu } = useRenderLayout()
  switch (getLayoutRenderMode(unref(layout))) {
    case 'classic':
      return renderClassic()
    case 'topLeft':
      return renderTopLeft()
    case 'top':
      return renderTop()
    case 'cutMenu':
      return renderCutMenu()
    default:
      break
  }
}

export default defineComponent({
  name: 'Layout',
  setup() {
    const { t } = useI18n()

    return () => (
      <section
        class={[
          prefixCls,
          `${prefixCls}__${layout.value}`,
          `${prefixCls}__${getLayoutRenderMode(layout.value)}`,
          'w-[100%] h-[100%] relative'
        ]}
      >
        {/* 移动端遮罩用原生 button，可键盘聚焦并带可访问名称 */}
        {mobile.value && !collapse.value ? (
          <button
            aria-label={t('layout.closeNavigation')}
            class={[
              `${prefixCls}__mask`,
              'absolute left-0 top-0 z-99 h-full w-full bg-[var(--el-color-black)] opacity-30'
            ]}
            type="button"
            onClick={handleClickOutside}
          ></button>
        ) : undefined}

        {renderLayout()}

        <Backtop></Backtop>

        {hideSetting ? undefined : <Setting></Setting>}
      </section>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-layout;

.#{$prefix-cls} {
  background-color: var(--app-content-bg-color);

  // 只重置原生 button 默认盒模型，层级仍由上面的 class 决定；
  // 遮罩外观：半透明深色 + 轻度背景模糊（用背景色透明度代替 opacity，焦点框不被淡化）
  &__mask {
    padding: 0;
    margin: 0;
    background-color: rgb(15 23 42 / 45%);
    border: 0;
    opacity: 1;
    appearance: none;
    backdrop-filter: blur(2px);

    // 遮罩铺满且 html/body overflow: hidden，原生焦点框改为内缩才不被裁掉
    &:focus-visible {
      outline-offset: -4px;
    }
  }

  // 顶栏（header-nav / header-sidebar-nav / mixed-nav / sidebar-mixed-nav / header-mixed-nav）：
  // 浮于下方菜单与内容之上，以壳层阴影区分；尺寸、背景色仍由原 class 与主题变量决定
  &__topbar {
    z-index: 20;
    box-shadow: var(--layout-shadow);
  }

  // sidebar-nav 的顶部工具栏 + 标签栏容器（固定头部时浮于内容之上）
  &__toolbar {
    box-shadow: var(--layout-shadow);
  }

  // 移动端展开的侧栏抽屉阴影，宽度不变
  &__sidebar--mobile-open {
    box-shadow: 20px 0 50px rgb(15 23 42 / 25%);
  }
}
</style>
