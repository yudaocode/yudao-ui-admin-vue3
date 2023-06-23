<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'
import { useIcon } from '@/hooks/web/useIcon'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ThemeSwitch' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('theme-switch')

const Sun = useIcon({ icon: 'emojione-monotone:sun', color: '#fde047' })

const CrescentMoon = useIcon({ icon: 'emojione-monotone:crescent-moon', color: '#fde047' })

const appStore = useAppStore()

// 初始化获取是否是暗黑主题
const isDark = ref(appStore.getIsDark)

// 设置switch的背景颜色
const blackColor = 'var(--el-color-black)'

const themeChange = (val: boolean) => {
  appStore.setIsDark(val)
}
</script>

<template>
  <ElSwitch
    v-model="isDark"
    :active-color="blackColor"
    :active-icon="Sun"
    :border-color="blackColor"
    :class="prefixCls"
    :inactive-color="blackColor"
    :inactive-icon="CrescentMoon"
    inline-prompt
    @change="themeChange"
  />
</template>
<style lang="scss" scoped>
:deep(.el-switch__core .el-switch__inner .is-icon) {
  overflow: visible;
}
</style>
