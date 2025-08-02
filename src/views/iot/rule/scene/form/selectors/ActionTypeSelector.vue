<!-- 执行器类型选择组件 -->
<template>
  <div class="w-full">
    <!-- TODO @puhui999：1）设备属性设置时，貌似没选属性；2）服务调用时，貌似也没的设置哈； -->
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
          <div class="flex items-center justify-between w-full py-4px">
            <div class="flex items-center gap-12px flex-1">
              <Icon
                :icon="option.icon"
                class="text-18px text-[var(--el-color-primary)] flex-shrink-0"
              />
              <div class="flex-1">
                <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">{{
                  option.label
                }}</div>
                <div class="text-12px text-[var(--el-text-color-secondary)] leading-relaxed">{{
                  option.description
                }}</div>
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
import { IotRuleSceneActionTypeEnum } from '@/views/iot/utils/constants'

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
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
