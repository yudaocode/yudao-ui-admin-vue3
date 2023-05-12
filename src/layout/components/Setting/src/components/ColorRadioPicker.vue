<script lang="ts" name="ColorRadioPicker" setup>
import { PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('color-radio-picker')

const props = defineProps({
  schema: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  modelValue: propTypes.string.def('')
})

const emit = defineEmits(['update:modelValue', 'change'])

const colorVal = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val: string) => {
    if (val === unref(colorVal)) return
    colorVal.value = val
  }
)

// 监听
watch(
  () => colorVal.value,
  (val: string) => {
    emit('update:modelValue', val)
    emit('change', val)
  }
)
</script>

<template>
  <div :class="prefixCls" class="flex flex-wrap space-x-14px">
    <span
      v-for="(item, i) in schema"
      :key="`radio-${i}`"
      :class="{ 'is-active': colorVal === item }"
      :style="{
        background: item
      }"
      class="w-20px h-20px cursor-pointer rounded-2px border-solid border-gray-300 border-2px text-center leading-20px mb-5px"
      @click="colorVal = item"
    >
      <Icon v-if="colorVal === item" :size="16" color="#fff" icon="ep:check" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-color-radio-picker;

.#{$prefix-cls} {
  .is-active {
    border-color: var(--el-color-primary);
  }
}
</style>
