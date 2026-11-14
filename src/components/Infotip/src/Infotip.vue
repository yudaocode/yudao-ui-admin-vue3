<script lang="ts" setup>
import { PropType } from 'vue'
import { useDesign } from '@/hooks/web/useDesign'
import type { TipSchema } from './types'

defineOptions({ name: 'InfoTip' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('infotip')

defineProps({
  title: { type: String, default: '' },
  schema: {
    type: Array as PropType<Array<string | TipSchema>>,
    default: () => []
  },
  showIndex: { type: Boolean, default: true },
  highlightColor: { type: String, default: 'var(--el-color-primary)' }
})

const emit = defineEmits(['click'])

const keyClick = (key: string) => {
  emit('click', key)
}
</script>

<template>
  <div
    :class="[
      prefixCls,
      'p-20px mb-20px border-1px border-solid border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
    ]"
  >
    <div v-if="title" :class="[`${prefixCls}__header`, 'flex items-center']">
      <Icon :size="22" color="var(--el-color-primary)" icon="ep:warning-filled" />
      <span :class="[`${prefixCls}__title`, 'pl-5px text-16px font-bold']">{{ title }}</span>
    </div>
    <div :class="`${prefixCls}__content`">
      <p v-for="(item, $index) in schema" :key="$index" class="mt-15px text-14px">
        <Highlight
          :color="highlightColor"
          :keys="typeof item === 'string' ? [] : item.keys"
          @click="keyClick"
        >
          {{ showIndex ? `${$index + 1}、` : '' }}{{ typeof item === 'string' ? item : item.label }}
        </Highlight>
      </p>
    </div>
  </div>
</template>
