<!-- 属性选择器组件 -->
<template>
  <div class="property-selector">
    <el-select
      v-model="localValue"
      placeholder="请选择监控项"
      filterable
      clearable
      @change="handleChange"
      class="w-full"
      :loading="loading"
    >
      <el-option-group
        v-for="group in propertyGroups"
        :key="group.label"
        :label="group.label"
      >
        <el-option
          v-for="property in group.options"
          :key="property.identifier"
          :label="property.name"
          :value="property.identifier"
        >
          <div class="property-option">
            <div class="option-content">
              <div class="option-name">{{ property.name }}</div>
              <div class="option-identifier">{{ property.identifier }}</div>
            </div>
            <div class="option-meta">
              <el-tag :type="getPropertyTypeTag(property.type)" size="small">
                {{ getPropertyTypeName(property.type) }}
              </el-tag>
            </div>
          </div>
        </el-option>
      </el-option-group>
    </el-select>

    <!-- 属性详情 -->
    <div v-if="selectedProperty" class="property-details">
      <div class="details-header">
        <Icon icon="ep:info-filled" class="details-icon" />
        <span class="details-title">{{ selectedProperty.name }}</span>
        <el-tag :type="getPropertyTypeTag(selectedProperty.type)" size="small">
          {{ getPropertyTypeName(selectedProperty.type) }}
        </el-tag>
      </div>
      <div class="details-content">
        <div class="detail-item">
          <span class="detail-label">标识符：</span>
          <span class="detail-value">{{ selectedProperty.identifier }}</span>
        </div>
        <div v-if="selectedProperty.description" class="detail-item">
          <span class="detail-label">描述：</span>
          <span class="detail-value">{{ selectedProperty.description }}</span>
        </div>
        <div v-if="selectedProperty.unit" class="detail-item">
          <span class="detail-label">单位：</span>
          <span class="detail-value">{{ selectedProperty.unit }}</span>
        </div>
        <div v-if="selectedProperty.range" class="detail-item">
          <span class="detail-label">取值范围：</span>
          <span class="detail-value">{{ selectedProperty.range }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { IotRuleSceneTriggerTypeEnum } from '@/api/iot/rule/scene/scene.types'

/** 属性选择器组件 */
defineOptions({ name: 'PropertySelector' })

interface Props {
  modelValue?: string
  triggerType: number
  productId?: number
  deviceId?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: { type: string; config: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 状态
const loading = ref(false)
const propertyList = ref<any[]>([])

// 计算属性
const propertyGroups = computed(() => {
  const groups: { label: string; options: any[] }[] = []
  
  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST) {
    groups.push({
      label: '设备属性',
      options: propertyList.value.filter(p => p.category === 'property')
    })
  }
  
  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST) {
    groups.push({
      label: '设备事件',
      options: propertyList.value.filter(p => p.category === 'event')
    })
  }
  
  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE) {
    groups.push({
      label: '设备服务',
      options: propertyList.value.filter(p => p.category === 'service')
    })
  }
  
  return groups.filter(group => group.options.length > 0)
})

const selectedProperty = computed(() => {
  return propertyList.value.find(p => p.identifier === localValue.value)
})

// 工具函数
const getPropertyTypeName = (type: string) => {
  const typeMap = {
    'int': '整数',
    'float': '浮点数',
    'double': '双精度',
    'string': '字符串',
    'bool': '布尔值',
    'enum': '枚举',
    'date': '日期',
    'struct': '结构体',
    'array': '数组'
  }
  return typeMap[type] || type
}

const getPropertyTypeTag = (type: string) => {
  const tagMap = {
    'int': 'primary',
    'float': 'success',
    'double': 'success',
    'string': 'info',
    'bool': 'warning',
    'enum': 'danger',
    'date': 'primary',
    'struct': 'info',
    'array': 'warning'
  }
  return tagMap[type] || 'info'
}

// 事件处理
const handleChange = (value: string) => {
  const property = propertyList.value.find(p => p.identifier === value)
  if (property) {
    emit('change', {
      type: property.type,
      config: property
    })
  }
}

// API 调用
const getPropertyList = async () => {
  if (!props.productId) {
    propertyList.value = []
    return
  }
  
  loading.value = true
  try {
    // 这里应该调用真实的API获取物模型数据
    // 暂时使用模拟数据
    propertyList.value = [
      // 属性
      {
        identifier: 'temperature',
        name: '温度',
        type: 'float',
        category: 'property',
        description: '环境温度',
        unit: '°C',
        range: '-40~80'
      },
      {
        identifier: 'humidity',
        name: '湿度',
        type: 'float',
        category: 'property',
        description: '环境湿度',
        unit: '%',
        range: '0~100'
      },
      {
        identifier: 'power',
        name: '电源状态',
        type: 'bool',
        category: 'property',
        description: '设备电源开关状态'
      },
      // 事件
      {
        identifier: 'alarm',
        name: '告警事件',
        type: 'struct',
        category: 'event',
        description: '设备告警事件'
      },
      {
        identifier: 'fault',
        name: '故障事件',
        type: 'struct',
        category: 'event',
        description: '设备故障事件'
      },
      // 服务
      {
        identifier: 'restart',
        name: '重启服务',
        type: 'struct',
        category: 'service',
        description: '设备重启服务'
      }
    ]
  } catch (error) {
    console.error('获取物模型失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听产品变化
watch(() => props.productId, () => {
  getPropertyList()
}, { immediate: true })

// 监听触发类型变化
watch(() => props.triggerType, () => {
  localValue.value = ''
})
</script>

<style scoped>
.property-selector {
  width: 100%;
}

.property-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}

.option-content {
  flex: 1;
}

.option-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.option-identifier {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: 'Courier New', monospace;
}

.option-meta {
  flex-shrink: 0;
}

.property-details {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.details-icon {
  color: var(--el-color-primary);
  font-size: 14px;
}

.details-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 22px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.detail-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-family: 'Courier New', monospace;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}
</style>
