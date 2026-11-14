<script lang="ts" setup>
import { PropType } from 'vue'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ColorRadioPicker' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('color-radio-picker')

const props = defineProps({
  schema: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  modelValue: { type: String, default: '' }
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
    <!-- 颜色选项为原生 button，可键盘选择并带可访问名称与选中状态 -->
    <button
      v-for="(item, i) in schema"
      :key="`radio-${i}`"
      :aria-label="item"
      :aria-pressed="colorVal === item"
      :class="[`${prefixCls}__option`, { 'is-active': colorVal === item }]"
      :style="{
        background: item
      }"
      class="mb-5px h-20px w-20px cursor-pointer border-2px border-gray-300 rounded-2px border-solid text-center leading-20px"
      type="button"
      @click="colorVal = item"
    >
      <Icon v-if="colorVal === item" :size="16" color="#fff" icon="ep:check" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-color-radio-picker;

// :where 不增加优先级，只重置原生 button 默认样式（尺寸、边框、背景色仍由原子类与内联样式决定），保留 focus outline；
// box-sizing 沿用全局 var.css 的 border-box，与原 span 同为 20×20
:where(.#{$prefix-cls}__option) {
  padding: 0;
  font: inherit;
  color: inherit;
}

.#{$prefix-cls} {
  .is-active {
    border-color: var(--el-color-primary);
  }
}
</style>
