<script lang="ts" setup>
import { ComponentSize, ElAvatar, ElTooltip } from 'element-plus'
import { computed, PropType } from 'vue'
import { AvatarItem } from './types'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Avatars' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('avatars')

const props = defineProps({
  size: {
    type: [String, Number] as PropType<ComponentSize | number>,
    default: ''
  },
  max: {
    type: Number,
    default: 5
  },
  data: {
    type: Array as PropType<AvatarItem[]>,
    default: () => []
  },
  showTooltip: {
    type: Boolean,
    default: true
  }
})

// max 归一化为非负整数：负数、NaN 按 0 处理，即全部折叠为 +N
const maxCount = computed(() => {
  const max = Math.floor(Number(props.max))
  return Number.isNaN(max) || max < 0 ? 0 : max
})

const filterData = computed(() => props.data.slice(0, maxCount.value))

// 超出 max 的数量
const overflowCount = computed(() => Math.max(props.data.length - maxCount.value, 0))
</script>

<template>
  <div :class="prefixCls" class="flex items-center">
    <!-- url 可能重复，key 带上下标 -->
    <template v-for="(item, index) in filterData" :key="`${index}-${item.url}`">
      <ElTooltip v-if="showTooltip && item.name" :content="item.name" placement="top">
        <ElAvatar :size="size" :src="item.url" :style="{ zIndex: index }" class="relative" />
      </ElTooltip>
      <ElAvatar v-else :size="size" :src="item.url" :style="{ zIndex: index }" class="relative" />
    </template>

    <ElAvatar v-if="overflowCount > 0" :size="size" :style="{ zIndex: data.length }">
      <span>+{{ overflowCount }}</span>
    </ElAvatar>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-avatars;

.#{$prefix-cls} {
  .#{$elNamespace}-avatar + .#{$elNamespace}-avatar {
    margin-left: -15px;
  }
}
</style>
