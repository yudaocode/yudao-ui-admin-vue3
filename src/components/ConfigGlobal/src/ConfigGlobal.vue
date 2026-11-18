<script setup lang="ts">
import { provide, computed, watch, onMounted } from 'vue'
import type { PropType } from 'vue'
import { ComponentSize, ElConfigProvider } from 'element-plus'
import { useLocaleStore } from '@/store/modules/locale'
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '@/store/modules/app'
import { setCssVar } from '@/utils'
import { useDesign } from '@/hooks/web/useDesign'
import { normalizeLayout } from '@/utils/layout'

const { variables } = useDesign()

const appStore = useAppStore()

// 原生运行时 props 声明，保留尺寸取值的运行时校验与默认 default；props 仍 provide 给 configGlobal 使用方
const props = defineProps({
  size: {
    type: String as PropType<ComponentSize>,
    default: 'default',
    validator: (v: string) => ['default', 'small', 'large'].includes(v)
  }
})

provide('configGlobal', props)

// 初始化所有主题色
onMounted(() => {
  appStore.setCssVarTheme()
})

const { width } = useWindowSize()

// 监听窗口变化
watch(
  () => width.value,
  (width: number) => {
    if (width < 768) {
      // 只在从桌面进入移动端时收起菜单；已处于移动端时宽度再变化，保留用户展开的菜单
      if (!appStore.getMobile) {
        appStore.setMobile(true)
        appStore.setCollapse(true)
      }
      setCssVar('--left-menu-min-width', '0')
      normalizeLayout(appStore.getLayout) !== 'sidebar-nav'
        ? appStore.setLayout('sidebar-nav')
        : undefined
    } else {
      if (appStore.getMobile) {
        appStore.setMobile(false)
        // 移动端强制的 sidebar-nav 未写缓存，回到桌面端恢复用户选择的布局
        appStore.restoreLayout()
      }
      // 桌面端去掉移动端写入的内联值，回落 var.css 的折叠宽度（72px），尺寸只在 var.css 维护
      document.documentElement.style.removeProperty('--left-menu-min-width')
    }
  },
  {
    immediate: true
  }
)

// 多语言相关
const localeStore = useLocaleStore()

const currentLocale = computed(() => localeStore.currentLocale)
</script>

<template>
  <ElConfigProvider
    :namespace="variables.elNamespace"
    :locale="currentLocale.elLocale"
    :message="{ max: 5 }"
    :size="size"
  >
    <slot></slot>
  </ElConfigProvider>
</template>
