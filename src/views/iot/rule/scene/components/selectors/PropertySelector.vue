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
              <el-tag :type="getPropertyTypeTag(property.dataType)" size="small">
                {{ getPropertyTypeName(property.dataType) }}
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
        <el-tag :type="getPropertyTypeTag(selectedProperty.dataType)" size="small">
          {{ getPropertyTypeName(selectedProperty.dataType) }}
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
import { ThingModelApi, ThingModelData } from '@/api/iot/thingmodel'
import { IoTThingModelTypeEnum } from '@/views/iot/utils/constants'
import type { IotThingModelTSLRespVO, PropertySelectorItem } from './types'

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
const propertyList = ref<PropertySelectorItem[]>([])
const thingModelTSL = ref<IotThingModelTSLRespVO | null>(null)

// 计算属性
const propertyGroups = computed(() => {
  const groups: { label: string; options: any[] }[] = []

  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST) {
    groups.push({
      label: '设备属性',
      options: propertyList.value.filter(p => p.type === IoTThingModelTypeEnum.PROPERTY)
    })
  }

  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST) {
    groups.push({
      label: '设备事件',
      options: propertyList.value.filter(p => p.type === IoTThingModelTypeEnum.EVENT)
    })
  }

  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE) {
    groups.push({
      label: '设备服务',
      options: propertyList.value.filter(p => p.type === IoTThingModelTypeEnum.SERVICE)
    })
  }

  return groups.filter(group => group.options.length > 0)
})

const selectedProperty = computed(() => {
  return propertyList.value.find(p => p.identifier === localValue.value)
})

// 工具函数
const getPropertyTypeName = (dataType: string) => {
  const typeMap = {
    'int': '整数',
    'float': '浮点数',
    'double': '双精度',
    'text': '字符串',
    'bool': '布尔值',
    'enum': '枚举',
    'date': '日期',
    'struct': '结构体',
    'array': '数组'
  }
  return typeMap[dataType] || dataType
}

const getPropertyTypeTag = (dataType: string) => {
  const tagMap = {
    'int': 'primary',
    'float': 'success',
    'double': 'success',
    'text': 'info',
    'bool': 'warning',
    'enum': 'danger',
    'date': 'primary',
    'struct': 'info',
    'array': 'warning'
  }
  return tagMap[dataType] || 'info'
}

// 事件处理
const handleChange = (value: string) => {
  const property = propertyList.value.find(p => p.identifier === value)
  if (property) {
    emit('change', {
      type: property.dataType,
      config: property
    })
  }
}

// 获取物模型TSL数据
const getThingModelTSL = async () => {
  if (!props.productId) {
    thingModelTSL.value = null
    propertyList.value = []
    return
  }

  loading.value = true
  try {
    thingModelTSL.value = await ThingModelApi.getThingModelTSLByProductId(props.productId)
    parseThingModelData()
  } catch (error) {
    console.error('获取物模型TSL失败:', error)
    // 如果TSL获取失败，尝试获取物模型列表
    await getThingModelList()
  } finally {
    loading.value = false
  }
}

// 获取物模型列表（备用方案）
const getThingModelList = async () => {
  if (!props.productId) {
    propertyList.value = []
    return
  }

  try {
    const data = await ThingModelApi.getThingModelList({ productId: props.productId })
    propertyList.value = data || []
  } catch (error) {
    console.error('获取物模型列表失败:', error)
    propertyList.value = []
  }
}

// 解析物模型TSL数据
const parseThingModelData = () => {
  const tsl = thingModelTSL.value
  const properties: PropertySelectorItem[] = []

  if (tsl) {
    // 解析属性
    if (tsl.properties && Array.isArray(tsl.properties)) {
      tsl.properties.forEach((prop) => {
        properties.push({
          identifier: prop.identifier,
          name: prop.name,
          description: prop.description,
          dataType: prop.dataType,
          type: IoTThingModelTypeEnum.PROPERTY,
          accessMode: prop.accessMode,
          required: prop.required,
          unit: getPropertyUnit(prop),
          range: getPropertyRange(prop),
          property: prop
        })
      })
    }

    // 解析事件
    if (tsl.events && Array.isArray(tsl.events)) {
      tsl.events.forEach((event) => {
        properties.push({
          identifier: event.identifier,
          name: event.name,
          description: event.description,
          dataType: 'struct',
          type: IoTThingModelTypeEnum.EVENT,
          eventType: event.type,
          required: event.required,
          outputParams: event.outputParams,
          event: event
        })
      })
    }

    // 解析服务
    if (tsl.services && Array.isArray(tsl.services)) {
      tsl.services.forEach((service) => {
        properties.push({
          identifier: service.identifier,
          name: service.name,
          description: service.description,
          dataType: 'struct',
          type: IoTThingModelTypeEnum.SERVICE,
          callType: service.callType,
          required: service.required,
          inputParams: service.inputParams,
          outputParams: service.outputParams,
          service: service
        })
      })
    }
  }

  propertyList.value = properties
}

// 获取属性单位
const getPropertyUnit = (property: any) => {
  if (!property) return undefined

  // 数值型数据的单位
  if (property.dataSpecs && property.dataSpecs.unit) {
    return property.dataSpecs.unit
  }

  return undefined
}

// 获取属性范围描述
const getPropertyRange = (property: any) => {
  if (!property) return undefined

  // 数值型数据的范围
  if (property.dataSpecs) {
    const specs = property.dataSpecs
    if (specs.min !== undefined && specs.max !== undefined) {
      return `${specs.min}~${specs.max}`
    }
  }

  // 枚举型和布尔型数据的选项
  if (property.dataSpecsList && Array.isArray(property.dataSpecsList)) {
    return property.dataSpecsList.map((item: any) => `${item.name}(${item.value})`).join(', ')
  }

  return undefined
}

// 获取数据范围描述（保留兼容性）
const getDataRange = (dataSpecs: any) => {
  if (!dataSpecs) return undefined

  if (dataSpecs.min !== undefined && dataSpecs.max !== undefined) {
    return `${dataSpecs.min}~${dataSpecs.max}`
  }

  if (dataSpecs.dataSpecsList && Array.isArray(dataSpecs.dataSpecsList)) {
    return dataSpecs.dataSpecsList.map((item: any) => `${item.name}(${item.value})`).join(', ')
  }

  return undefined
}

// 监听产品变化
watch(() => props.productId, () => {
  getThingModelTSL()
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
