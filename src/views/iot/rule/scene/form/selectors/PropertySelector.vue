<!-- 属性选择器组件 -->
<!-- TODO @yunai：可能要在 review 下 -->
<template>
  <div class="flex items-center gap-8px">
    <el-select
      v-model="localValue"
      placeholder="请选择监控项"
      filterable
      clearable
      @change="handleChange"
      class="!w-150px"
      :loading="loading"
    >
      <el-option-group v-for="group in propertyGroups" :key="group.label" :label="group.label">
        <el-option
          v-for="property in group.options"
          :key="property.identifier"
          :label="property.name"
          :value="property.identifier"
        >
          <div class="flex items-center justify-between w-full py-4px">
            <div class="flex-1">
              <div class="text-14px font-500 text-[var(--el-text-color-primary)] mb-2px">
                {{ property.name }}
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                {{ property.identifier }}
              </div>
            </div>
            <div class="flex-shrink-0">
              <el-tag :type="getPropertyTypeTag(property.dataType)" size="small">
                {{ getPropertyTypeName(property.dataType) }}
              </el-tag>
            </div>
          </div>
        </el-option>
      </el-option-group>
    </el-select>

    <!-- 属性详情弹出层 -->
    <el-popover
      v-if="selectedProperty"
      placement="right-start"
      :width="350"
      trigger="click"
      :show-arrow="true"
      :offset="8"
      popper-class="property-detail-popover"
    >
      <template #reference>
        <el-button
          type="info"
          :icon="InfoFilled"
          circle
          size="small"
          class="flex-shrink-0"
          title="查看属性详情"
        />
      </template>

      <!-- 弹出层内容 -->
      <div class="property-detail-content">
        <div class="flex items-center gap-8px mb-12px">
          <Icon icon="ep:info-filled" class="text-[var(--el-color-info)] text-16px" />
          <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
            {{ selectedProperty.name }}
          </span>
          <el-tag :type="getPropertyTypeTag(selectedProperty.dataType)" size="small">
            {{ getPropertyTypeName(selectedProperty.dataType) }}
          </el-tag>
        </div>

        <div class="space-y-8px ml-24px">
          <div class="flex items-start gap-8px">
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              标识符：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ selectedProperty.identifier }}
            </span>
          </div>

          <div v-if="selectedProperty.description" class="flex items-start gap-8px">
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              描述：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ selectedProperty.description }}
            </span>
          </div>

          <div v-if="selectedProperty.unit" class="flex items-start gap-8px">
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              单位：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ selectedProperty.unit }}
            </span>
          </div>

          <div v-if="selectedProperty.range" class="flex items-start gap-8px">
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              取值范围：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ selectedProperty.range }}
            </span>
          </div>

          <!-- 根据属性类型显示额外信息 -->
          <div
            v-if="
              selectedProperty.type === IoTThingModelTypeEnum.PROPERTY &&
              selectedProperty.accessMode
            "
            class="flex items-start gap-8px"
          >
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              访问模式：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ getAccessModeText(selectedProperty.accessMode) }}
            </span>
          </div>

          <div
            v-if="
              selectedProperty.type === IoTThingModelTypeEnum.EVENT && selectedProperty.eventType
            "
            class="flex items-start gap-8px"
          >
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              事件类型：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ getEventTypeText(selectedProperty.eventType) }}
            </span>
          </div>

          <div
            v-if="
              selectedProperty.type === IoTThingModelTypeEnum.SERVICE && selectedProperty.callType
            "
            class="flex items-start gap-8px"
          >
            <span class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0">
              调用类型：
            </span>
            <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
              {{ getCallTypeText(selectedProperty.callType) }}
            </span>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { InfoFilled } from '@element-plus/icons-vue'
import { IotRuleSceneTriggerTypeEnum, IoTThingModelTypeEnum } from '@/views/iot/utils/constants'
import { ThingModelApi } from '@/api/iot/thingmodel'
import type { IotThingModelTSLRespVO, PropertySelectorItem } from '@/api/iot/rule/scene/scene.types'

/** 属性选择器组件 */
defineOptions({ name: 'PropertySelector' })

const props = defineProps<{
  modelValue?: string
  triggerType: number
  productId?: number
  deviceId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: { type: string; config: any }): void
}>()

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
      options: propertyList.value.filter((p) => p.type === IoTThingModelTypeEnum.PROPERTY)
    })
  }

  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST) {
    groups.push({
      label: '设备事件',
      options: propertyList.value.filter((p) => p.type === IoTThingModelTypeEnum.EVENT)
    })
  }

  if (props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE) {
    groups.push({
      label: '设备服务',
      options: propertyList.value.filter((p) => p.type === IoTThingModelTypeEnum.SERVICE)
    })
  }

  return groups.filter((group) => group.options.length > 0)
})

const selectedProperty = computed(() => {
  return propertyList.value.find((p) => p.identifier === localValue.value)
})

// 工具函数
const getPropertyTypeName = (dataType: string) => {
  const typeMap = {
    int: '整数',
    float: '浮点数',
    double: '双精度',
    text: '字符串',
    bool: '布尔值',
    enum: '枚举',
    date: '日期',
    struct: '结构体',
    array: '数组'
  }
  return typeMap[dataType] || dataType
}

const getPropertyTypeTag = (dataType: string) => {
  const tagMap = {
    int: 'primary',
    float: 'success',
    double: 'success',
    text: 'info',
    bool: 'warning',
    enum: 'danger',
    date: 'primary',
    struct: 'info',
    array: 'warning'
  }
  return tagMap[dataType] || 'info'
}

// 工具函数 - 获取访问模式文本
const getAccessModeText = (accessMode: string) => {
  const modeMap = {
    r: '只读',
    w: '只写',
    rw: '读写'
  }
  return modeMap[accessMode] || accessMode
}

// 工具函数 - 获取事件类型文本
const getEventTypeText = (eventType: string) => {
  const typeMap = {
    info: '信息',
    alert: '告警',
    error: '故障'
  }
  return typeMap[eventType] || eventType
}

// 工具函数 - 获取调用类型文本
const getCallTypeText = (callType: string) => {
  const typeMap = {
    sync: '同步',
    async: '异步'
  }
  return typeMap[callType] || callType
}

// 事件处理
const handleChange = (value: string) => {
  const property = propertyList.value.find((p) => p.identifier === value)
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

// 监听产品变化
watch(
  () => props.productId,
  () => {
    getThingModelTSL()
  },
  { immediate: true }
)

// 监听触发类型变化
watch(
  () => props.triggerType,
  () => {
    localValue.value = ''
    // el-popover 会自动关闭，无需手动处理
  }
)
</script>

<style scoped>
/* 下拉选项样式 */
:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}

/* 弹出层内容样式 */
.property-detail-content {
  padding: 4px 0;
}

/* 弹出层自定义样式 */
:global(.property-detail-popover) {
  /* 可以在这里添加全局弹出层样式 */
  max-width: 400px !important;
}

:global(.property-detail-popover .el-popover__content) {
  padding: 16px !important;
}
</style>
