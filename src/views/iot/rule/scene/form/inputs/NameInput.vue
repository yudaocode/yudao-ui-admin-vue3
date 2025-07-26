<!-- 场景名称输入组件 -->
<template>
  <div class="relative w-full">
    <el-input
      v-model="localValue"
      placeholder="请输入场景名称"
      maxlength="50"
      show-word-limit
      clearable
      @blur="handleBlur"
      @input="handleInput"
    >
      <template #prefix>
        <Icon icon="ep:edit" class="text-[var(--el-text-color-placeholder)]" />
      </template>
    </el-input>

    <!-- 智能提示 -->
    <!-- TODO @puhui999：暂时不用考虑智能推荐哈。用途不大 -->
    <div v-if="showSuggestions && suggestions.length > 0" class="absolute top-full left-0 right-0 z-1000 bg-white border border-[var(--el-border-color-light)] rounded-4px shadow-[var(--el-box-shadow-light)] mt-4px">
      <div class="p-8px px-12px border-b border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]">
        <span class="text-12px text-[var(--el-text-color-secondary)] font-500">推荐名称</span>
      </div>
      <div class="max-h-200px overflow-y-auto">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="p-8px px-12px cursor-pointer transition-colors duration-200 text-14px text-[var(--el-text-color-primary)] hover:bg-[var(--el-fill-color-light)] last:border-b-0"
          @click="applySuggestion(suggestion)"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 场景名称输入组件 */
defineOptions({ name: 'NameInput' })

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 智能提示相关
const showSuggestions = ref(false)
const suggestions = ref<string[]>([])

// 常用场景名称模板
const nameTemplates = [
  '温度过高自动降温',
  '设备离线告警通知',
  '湿度异常自动调节',
  '夜间安防模式启动',
  '能耗超标自动关闭',
  '故障设备自动重启',
  '定时设备状态检查',
  '环境数据异常告警'
]

const handleInput = (value: string) => {
  if (value.length > 0 && value.length < 10) {
    // 根据输入内容过滤建议
    suggestions.value = nameTemplates
      .filter(
        (template) =>
          template.includes(value) || (value.includes('温度') && template.includes('温度'))
      )
      .slice(0, 5)
    showSuggestions.value = suggestions.value.length > 0
  } else {
    showSuggestions.value = false
  }
}

const handleBlur = () => {
  // 延迟隐藏建议，允许点击建议项
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const applySuggestion = (suggestion: string) => {
  localValue.value = suggestion
  showSuggestions.value = false
}

// 监听外部点击隐藏建议
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.name-input')) {
      showSuggestions.value = false
    }
  })
})
</script>


