<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'
import { useIcon } from '@/hooks/web/useIcon'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ThemeSwitch' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('theme-switch')

const Sun = useIcon({ icon: 'emojione-monotone:sun', color: '#fde047' })

const CrescentMoon = useIcon({ icon: 'emojione-monotone:crescent-moon', color: '#fde047' })

// 用户切换后触发，参数为切换后的是否暗黑；外部修改 store 时不触发（参考上游 b34aeba10；状态同步沿用 f015fc2ff）
const emit = defineEmits<{
  (e: 'change', isDark: boolean): void
}>()

const { t } = useI18n()

const appStore = useAppStore()

// 与 store 双向同步是否是暗黑主题，避免只取初始快照导致外部修改后状态不一致；
// 只切换暗黑状态，不重设芋道自定义的菜单 / 头部颜色
const isDark = computed({
  get: () => appStore.getIsDark,
  set: (val: boolean) => {
    appStore.setIsDark(val)
    emit('change', val)
  }
})

// 设置switch的背景颜色
const blackColor = 'var(--el-color-black)'
</script>

<template>
  <ElSwitch
    v-model="isDark"
    :active-color="blackColor"
    :active-icon="Sun"
    :aria-label="t('layout.toggleDarkMode')"
    :border-color="blackColor"
    :class="prefixCls"
    :inactive-color="blackColor"
    :inactive-icon="CrescentMoon"
    inline-prompt
  />
</template>
<style lang="scss" scoped>
:deep(.el-switch__core .el-switch__inner .is-icon) {
  overflow: visible;
}
</style>
