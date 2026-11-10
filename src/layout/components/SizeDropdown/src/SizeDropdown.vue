<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'

import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { ElementPlusSize } from '@/types/elementPlus'

defineOptions({ name: 'SizeDropdown' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('size-dropdown')

defineProps({
  color: propTypes.string.def('')
})

const { t } = useI18n()

const appStore = useAppStore()

const sizeMap = computed(() => appStore.sizeMap)

const setCurrentSize = (size: ElementPlusSize) => {
  appStore.setCurrentSize(size)
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click" @command="setCurrentSize">
    <!-- 原生 button 作为触发器，可键盘聚焦并带可访问名称（与 LocaleDropdown 一致）；外部 class 继续落在触发器上 -->
    <button
      :aria-label="t('layout.switchSize')"
      :class="$attrs.class"
      class="size-dropdown-trigger cursor-pointer !p-0"
      type="button"
    >
      <Icon :color="color" :size="18" class="cursor-pointer" icon="mdi:format-size" />
    </button>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem v-for="item in sizeMap" :key="item" :command="item">
          {{ t(`size.${item}`) }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style lang="scss" scoped>
:where(.size-dropdown-trigger) {
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
}
</style>
