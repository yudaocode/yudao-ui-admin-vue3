<!-- 定时触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <div class="flex items-center justify-between p-12px px-16px bg-[var(--el-fill-color-light)] rounded-6px border border-[var(--el-border-color-lighter)]">
      <div class="flex items-center gap-8px">
        <Icon icon="ep:timer" class="text-[var(--el-color-danger)] text-18px" />
        <span class="text-14px font-500 text-[var(--el-text-color-primary)]">定时触发配置</span>
      </div>
      <div class="flex items-center gap-8px">
        <el-button type="text" size="small" @click="showBuilder = !showBuilder">
          <Icon :icon="showBuilder ? 'ep:edit' : 'ep:setting'" />
          {{ showBuilder ? '手动编辑' : '可视化编辑' }}
        </el-button>
      </div>
    </div>

    <!-- 可视化编辑器 -->
    <!-- TODO @puhui999：是不是复用现有的 cron 组件；不然有点重复哈；维护比较复杂 -->
    <div v-if="showBuilder" class="p-16px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]">
      <CronBuilder v-model="localValue" @validate="handleValidate" />
    </div>

    <!-- 手动编辑 -->
    <div v-else class="p-16px border border-[var(--el-border-color-lighter)] rounded-6px bg-[var(--el-fill-color-blank)]">
      <el-form-item label="CRON表达式" required>
        <CronInput v-model="localValue" @validate="handleValidate" />
      </el-form-item>
    </div>

    <!-- 下次执行时间预览 -->
    <NextExecutionPreview :cron-expression="localValue" />

    <!-- 验证结果 -->
    <div v-if="validationMessage" class="mt-8px">
      <el-alert
        :title="validationMessage"
        :type="isValid ? 'success' : 'error'"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import CronBuilder from '../inputs/CronBuilder.vue'
import CronInput from '../inputs/CronInput.vue'
import NextExecutionPreview from '../previews/NextExecutionPreview.vue'

/** 定时触发配置组件 */
defineOptions({ name: 'TimerTriggerConfig' })

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: '0 0 12 * * ?'
})

// 状态
const showBuilder = ref(true)
const validationMessage = ref('')
const isValid = ref(true)

// 事件处理
const handleValidate = (result: { valid: boolean; message: string }) => {
  isValid.value = result.valid
  validationMessage.value = result.message
  emit('validate', result)
}

// 初始验证
onMounted(() => {
  handleValidate({ valid: true, message: '定时触发配置验证通过' })
})
</script>


