<!-- 执行器类型选择组件 -->
<template>
  <div class="action-type-selector">
    <el-form-item label="执行类型" required>
      <el-select
        v-model="localValue"
        placeholder="请选择执行类型"
        @change="handleChange"
        class="w-full"
      >
        <el-option
          v-for="option in actionTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        >
          <div class="action-option">
            <div class="option-content">
              <Icon :icon="option.icon" class="option-icon" />
              <div class="option-info">
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.description }}</div>
              </div>
            </div>
            <el-tag :type="option.tag" size="small">
              {{ option.category }}
            </el-tag>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IotRuleSceneActionTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 执行器类型选择组件 */
defineOptions({ name: 'ActionTypeSelector' })

interface Props {
  modelValue: number
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 执行器类型选项
const actionTypeOptions = [
  {
    value: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    label: '设备属性设置',
    description: '设置目标设备的属性值',
    icon: 'ep:edit',
    tag: 'primary',
    category: '设备控制'
  },
  {
    value: IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE,
    label: '设备服务调用',
    description: '调用目标设备的服务',
    icon: 'ep:service',
    tag: 'success',
    category: '设备控制'
  },
  {
    value: IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    label: '触发告警',
    description: '触发系统告警通知',
    icon: 'ep:warning',
    tag: 'danger',
    category: '告警通知'
  },
  {
    value: IotRuleSceneActionTypeEnum.ALERT_RECOVER,
    label: '恢复告警',
    description: '恢复已触发的告警',
    icon: 'ep:circle-check',
    tag: 'warning',
    category: '告警通知'
  }
]

// 事件处理
const handleChange = (value: number) => {
  emit('change', value)
}
</script>

<style scoped>
.action-type-selector {
  width: 100%;
}

.action-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.option-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.option-info {
  flex: 1;
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.option-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
