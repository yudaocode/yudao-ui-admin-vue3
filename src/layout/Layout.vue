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
  switch (getLayoutRenderMode(unref(layout))) {
    case 'classic':
      const { renderClassic } = useRenderLayout()
      return renderClassic()
    case 'topLeft':
      const { renderTopLeft } = useRenderLayout()
      return renderTopLeft()
    case 'top':
      const { renderTop } = useRenderLayout()
      return renderTop()
    case 'cutMenu':
      const { renderCutMenu } = useRenderLayout()
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
        {/* 移动端遮罩用原生 button，可键盘聚焦并带可访问名称（参考上游 6b10db306） */}
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

  // 只重置原生 button 默认盒模型，遮罩颜色、透明度、层级仍由上面的 class 决定
  &__mask {
    padding: 0;
    margin: 0;
    border: 0;
    appearance: none;

    // 遮罩铺满且 html/body overflow: hidden，原生焦点框改为内缩才不被裁掉；
    // opacity 会连带淡化焦点框，聚焦时把 30% 黑移到背景色上，视觉不变
    &:focus-visible {
      background-color: rgb(0 0 0 / 30%);
      outline-offset: -4px;
      opacity: 1;
    }
  }
}
</style>
