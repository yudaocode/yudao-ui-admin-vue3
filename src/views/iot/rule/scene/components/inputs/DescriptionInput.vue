<!-- 场景描述输入组件 -->
<template>
  <div class="description-input">
    <el-input
      v-model="localValue"
      type="textarea"
      placeholder="请输入场景描述（可选）"
      :rows="3"
      maxlength="200"
      show-word-limit
      resize="none"
      @input="handleInput"
    />
    
    <!-- 描述模板 -->
    <div v-if="showTemplates" class="templates">
      <div class="templates-header">
        <span class="templates-title">描述模板</span>
        <el-button 
          type="text" 
          size="small" 
          @click="showTemplates = false"
        >
          <Icon icon="ep:close" />
        </el-button>
      </div>
      <div class="templates-list">
        <div
          v-for="template in descriptionTemplates"
          :key="template.title"
          class="template-item"
          @click="applyTemplate(template)"
        >
          <div class="template-title">{{ template.title }}</div>
          <div class="template-content">{{ template.content }}</div>
        </div>
      </div>
    </div>
    
    <!-- 模板按钮 -->
    <div v-if="!localValue && !showTemplates" class="template-trigger">
      <el-button 
        type="text" 
        size="small" 
        @click="showTemplates = true"
      >
        <Icon icon="ep:document" class="mr-1" />
        使用模板
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

/** 场景描述输入组件 */
defineOptions({ name: 'DescriptionInput' })

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit, {
  defaultValue: ''
})

const showTemplates = ref(false)

// 描述模板
const descriptionTemplates = [
  {
    title: '温度控制场景',
    content: '当环境温度超过设定阈值时，自动启动空调降温设备，确保环境温度保持在舒适范围内。'
  },
  {
    title: '设备监控场景',
    content: '实时监控关键设备的运行状态，当设备出现异常或离线时，立即发送告警通知相关人员。'
  },
  {
    title: '节能控制场景',
    content: '根据时间段和环境条件，自动调节设备功率或关闭非必要设备，实现智能节能管理。'
  },
  {
    title: '安防联动场景',
    content: '当检测到异常情况时，自动触发安防设备联动，包括报警器、摄像头录制等安全措施。'
  },
  {
    title: '定时任务场景',
    content: '按照预设的时间计划，定期执行设备检查、数据备份或系统维护等自动化任务。'
  }
]

const handleInput = (value: string) => {
  if (value.length > 0) {
    showTemplates.value = false
  }
}

const applyTemplate = (template: any) => {
  localValue.value = template.content
  showTemplates.value = false
}
</script>

<style scoped>
.description-input {
  position: relative;
  width: 100%;
}

.templates {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  box-shadow: var(--el-box-shadow-light);
  margin-top: 4px;
}

.templates-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.templates-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.templates-list {
  max-height: 300px;
  overflow-y: auto;
}

.template-item {
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.template-item:hover {
  background: var(--el-fill-color-light);
}

.template-item:last-child {
  border-bottom: none;
}

.template-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.template-content {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.template-trigger {
  margin-top: 8px;
  text-align: right;
}
</style>
