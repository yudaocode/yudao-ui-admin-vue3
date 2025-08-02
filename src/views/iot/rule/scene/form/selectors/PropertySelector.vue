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

    <!-- 属性详情触发按钮 -->
    <div class="relative">
      <el-button
        v-if="selectedProperty"
        ref="detailTriggerRef"
        type="info"
        :icon="InfoFilled"
        circle
        size="small"
        @click="togglePropertyDetail"
        class="flex-shrink-0"
        title="查看属性详情"
      />

      <!-- 属性详情弹出层 -->
      <Teleport to="body">
        <div
          v-if="showPropertyDetail && selectedProperty"
          ref="propertyDetailRef"
          class="property-detail-popover"
          :style="popoverStyle"
        >
          <div
            class="p-16px bg-white rounded-8px shadow-lg border border-[var(--el-border-color)] min-w-300px max-w-400px"
          >
            <div class="flex items-center gap-8px mb-12px">
              <Icon icon="ep:info-filled" class="text-[var(--el-color-info)] text-4px" />
              <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                {{ selectedProperty.name }}
              </span>
              <el-tag :type="getPropertyTypeTag(selectedProperty.dataType)" size="small">
                {{ getPropertyTypeName(selectedProperty.dataType) }}
              </el-tag>
            </div>
            <div class="space-y-8px ml-24px">
              <div class="flex items-start gap-8px">
                <span
                  class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0"
                >
                  标识符：
                </span>
                <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
                  {{ selectedProperty.identifier }}
                </span>
              </div>
              <div v-if="selectedProperty.description" class="flex items-start gap-8px">
                <span
                  class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0"
                >
                  描述：
                </span>
                <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
                  {{ selectedProperty.description }}
                </span>
              </div>
              <div v-if="selectedProperty.unit" class="flex items-start gap-8px">
                <span
                  class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0"
                >
                  单位：
                </span>
                <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
                  {{ selectedProperty.unit }}
                </span>
              </div>
              <div v-if="selectedProperty.range" class="flex items-start gap-8px">
                <span
                  class="text-12px text-[var(--el-text-color-secondary)] min-w-60px flex-shrink-0"
                >
                  取值范围：
                </span>
                <span class="text-12px text-[var(--el-text-color-primary)] flex-1">
                  {{ selectedProperty.range }}
                </span>
              </div>
            </div>
            <!-- 关闭按钮 -->
            <div class="flex justify-end mt-12px">
              <el-button size="small" @click="hidePropertyDetail">关闭</el-button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
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

// 属性详情弹出层相关状态
const showPropertyDetail = ref(false)
const detailTriggerRef = ref()
const propertyDetailRef = ref()
const popoverStyle = ref({})

// 点击外部关闭弹出层
const handleClickOutside = (event: MouseEvent) => {
  if (
    showPropertyDetail.value &&
    propertyDetailRef.value &&
    detailTriggerRef.value &&
    !propertyDetailRef.value.contains(event.target as Node) &&
    !detailTriggerRef.value.$el.contains(event.target as Node)
  ) {
    hidePropertyDetail()
  }
}

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

// 弹出层控制方法
const togglePropertyDetail = () => {
  if (showPropertyDetail.value) {
    hidePropertyDetail()
  } else {
    showPropertyDetailPopover()
  }
}

const showPropertyDetailPopover = () => {
  if (!selectedProperty.value || !detailTriggerRef.value) return

  showPropertyDetail.value = true

  nextTick(() => {
    updatePopoverPosition()
  })
}

const hidePropertyDetail = () => {
  showPropertyDetail.value = false
}

const updatePopoverPosition = () => {
  if (!detailTriggerRef.value || !propertyDetailRef.value) return

  const triggerEl = detailTriggerRef.value.$el
  const triggerRect = triggerEl.getBoundingClientRect()
  const popoverEl = propertyDetailRef.value

  // 计算弹出层位置
  const left = triggerRect.left + triggerRect.width + 8
  const top = triggerRect.top

  // 检查是否超出视窗右边界
  const popoverWidth = 400 // 最大宽度
  const viewportWidth = window.innerWidth

  let finalLeft = left
  if (left + popoverWidth > viewportWidth - 16) {
    // 如果超出右边界，显示在左侧
    finalLeft = triggerRect.left - popoverWidth - 8
  }

  // 检查是否超出视窗下边界
  let finalTop = top
  const popoverHeight = popoverEl.offsetHeight || 200
  const viewportHeight = window.innerHeight

  if (top + popoverHeight > viewportHeight - 16) {
    finalTop = Math.max(16, viewportHeight - popoverHeight - 16)
  }

  popoverStyle.value = {
    position: 'fixed',
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    zIndex: 9999
  }
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
  // 选择变化时隐藏详情弹出层
  hidePropertyDetail()
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
    hidePropertyDetail()
  }
)

// 监听窗口大小变化，重新计算弹出层位置
const handleResize = () => {
  if (showPropertyDetail.value) {
    updatePopoverPosition()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-4px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 8px 20px;
}

.property-detail-popover {
  animation: fadeInScale 0.2s ease-out;
  transform-origin: top left;
}

/* 弹出层箭头效果（可选） */
.property-detail-popover::before {
  position: absolute;
  top: 20px;
  left: -8px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-right: 8px solid var(--el-border-color);
  border-bottom: 8px solid transparent;
  content: '';
}

.property-detail-popover::after {
  position: absolute;
  top: 20px;
  left: -7px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-right: 8px solid white;
  border-bottom: 8px solid transparent;
  content: '';
}
</style>
