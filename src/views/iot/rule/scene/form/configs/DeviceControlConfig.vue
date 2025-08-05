<!-- 设备控制配置组件 -->
<!-- TODO @puhui999：貌似没生效~~~ -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 产品和设备选择 - 与触发器保持一致的分离式选择器 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="产品" required>
          <ProductSelector v-model="action.productId" @change="handleProductChange" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备" required>
          <DeviceSelector
            v-model="action.deviceId"
            :product-id="action.productId"
            @change="handleDeviceChange"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 服务选择 - 服务调用类型时显示 -->
    <div v-if="action.productId && isServiceInvokeAction" class="space-y-16px">
      <el-form-item label="服务" required>
        <el-select
          v-model="action.identifier"
          placeholder="请选择服务"
          filterable
          clearable
          class="w-full"
          :loading="loadingServices"
          @change="handleServiceChange"
        >
          <el-option
            v-for="service in serviceList"
            :key="service.identifier"
            :label="service.name"
            :value="service.identifier"
          >
            <div class="flex items-center justify-between">
              <span>{{ service.name }}</span>
              <el-tag :type="service.callType === 'sync' ? 'primary' : 'success'" size="small">
                {{ service.callType === 'sync' ? '同步' : '异步' }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 服务参数配置 -->
      <div v-if="action.identifier" class="space-y-16px">
        <el-form-item label="服务参数" required>
          <div class="w-full space-y-8px">
            <!-- JSON 输入框 -->
            <div class="relative">
              <el-input
                v-model="paramsJson"
                type="textarea"
                :rows="6"
                placeholder="请输入JSON格式的服务参数"
                @input="handleParamsChange"
                :class="{ 'is-error': jsonError }"
              />
              <!-- 查看详细示例按钮 -->
              <div class="absolute top-8px right-8px">
                <el-button
                  ref="exampleTriggerRef"
                  type="info"
                  :icon="InfoFilled"
                  circle
                  size="small"
                  @click="toggleExampleDetail"
                  title="查看详细示例"
                />
              </div>
            </div>

            <!-- 验证状态和错误提示 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-8px">
                <Icon
                  :icon="jsonError ? 'ep:warning' : 'ep:circle-check'"
                  :class="
                    jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'
                  "
                  class="text-14px"
                />
                <span
                  :class="
                    jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'
                  "
                  class="text-12px"
                >
                  {{ jsonError || 'JSON格式正确' }}
                </span>
              </div>

              <!-- 快速填充按钮 -->
              <div
                v-if="selectedService?.inputParams?.length > 0"
                class="flex items-center gap-8px"
              >
                <span class="text-12px text-[var(--el-text-color-secondary)]">快速填充：</span>
                <el-button size="small" type="primary" plain @click="fillServiceExampleJson">
                  示例数据
                </el-button>
                <el-button size="small" type="default" plain @click="clearParams"> 清空 </el-button>
              </div>
            </div>
          </div>
        </el-form-item>
      </div>
    </div>

    <!-- 控制参数配置 - 属性设置类型时显示 -->
    <div v-if="action.productId && isPropertySetAction" class="space-y-16px">
      <!-- 参数配置 -->
      <el-form-item label="参数" required>
        <div class="w-full space-y-8px">
          <!-- JSON 输入框 -->
          <div class="relative">
            <el-input
              v-model="paramsJson"
              type="textarea"
              :rows="6"
              placeholder="请输入JSON格式的控制参数"
              @input="handleParamsChange"
              :class="{ 'is-error': jsonError }"
            />
            <!-- 查看详细示例按钮 -->
            <div class="absolute top-8px right-8px">
              <el-button
                ref="exampleTriggerRef"
                type="info"
                :icon="InfoFilled"
                circle
                size="small"
                @click="toggleExampleDetail"
                title="查看详细示例"
              />
            </div>
          </div>

          <!-- 验证状态和错误提示 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-8px">
              <Icon
                :icon="jsonError ? 'ep:warning' : 'ep:circle-check'"
                :class="
                  jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'
                "
                class="text-14px"
              />
              <span
                :class="
                  jsonError ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-color-success)]'
                "
                class="text-12px"
              >
                {{ jsonError || 'JSON格式正确' }}
              </span>
            </div>

            <!-- 快速填充按钮 -->
            <div v-if="thingModelProperties.length > 0" class="flex items-center gap-8px">
              <span class="text-12px text-[var(--el-text-color-secondary)]">快速填充：</span>
              <el-button size="small" type="primary" plain @click="fillExampleJson">
                示例数据
              </el-button>
              <el-button size="small" type="default" plain @click="clearParams"> 清空 </el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 详细示例弹出层 -->
      <Teleport to="body">
        <div
          v-if="showExampleDetail"
          ref="exampleDetailRef"
          class="example-detail-popover"
          :style="examplePopoverStyle"
        >
          <div
            class="p-16px bg-white rounded-8px shadow-lg border border-[var(--el-border-color)] min-w-400px max-w-500px"
          >
            <div class="flex items-center gap-8px mb-16px">
              <Icon icon="ep:document" class="text-[var(--el-color-info)] text-18px" />
              <span class="text-16px font-600 text-[var(--el-text-color-primary)]">
                参数配置详细示例
              </span>
            </div>

            <div class="space-y-16px">
              <!-- 服务参数示例 - 服务调用时显示 -->
              <div v-if="isServiceInvokeAction && selectedService?.inputParams?.length > 0">
                <div class="flex items-center gap-8px mb-8px">
                  <Icon icon="ep:service" class="text-[var(--el-color-success)] text-14px" />
                  <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                    当前服务输入参数
                  </span>
                </div>
                <div class="ml-22px space-y-8px">
                  <div
                    v-for="param in selectedService.inputParams.slice(0, 4)"
                    :key="param.identifier"
                    class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                  >
                    <div class="flex-1">
                      <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                        {{ param.name }}
                      </div>
                      <div class="text-11px text-[var(--el-text-color-secondary)]">
                        {{ param.identifier }}
                      </div>
                    </div>
                    <div class="flex items-center gap-8px">
                      <el-tag :type="getPropertyTypeTag(param.dataType)" size="small">
                        {{ getPropertyTypeName(param.dataType) }}
                      </el-tag>
                      <span class="text-11px text-[var(--el-text-color-secondary)]">
                        {{ getExampleValueForParam(param) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="mt-12px ml-22px">
                  <div class="text-12px text-[var(--el-text-color-secondary)] mb-6px">
                    完整JSON格式：
                  </div>
                  <pre
                    class="p-12px bg-[var(--el-fill-color-light)] rounded-4px text-11px text-[var(--el-text-color-primary)] overflow-x-auto border-l-3px border-[var(--el-color-success)]"
                  ><code>{{ generateServiceExampleJson() }}</code></pre>
                </div>
              </div>

              <!-- 物模型属性示例 - 属性设置时显示 -->
              <div v-if="isPropertySetAction && thingModelProperties.length > 0">
                <div class="flex items-center gap-8px mb-8px">
                  <Icon icon="ep:edit" class="text-[var(--el-color-primary)] text-14px" />
                  <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                    当前物模型属性
                  </span>
                </div>
                <div class="ml-22px space-y-8px">
                  <div
                    v-for="property in thingModelProperties.slice(0, 4)"
                    :key="property.identifier"
                    class="flex items-center justify-between p-8px bg-[var(--el-fill-color-lighter)] rounded-4px"
                  >
                    <div class="flex-1">
                      <div class="text-12px font-500 text-[var(--el-text-color-primary)]">
                        {{ property.name }}
                      </div>
                      <div class="text-11px text-[var(--el-text-color-secondary)]">
                        {{ property.identifier }}
                      </div>
                    </div>
                    <div class="flex items-center gap-8px">
                      <el-tag :type="getPropertyTypeTag(property.dataType)" size="small">
                        {{ getPropertyTypeName(property.dataType) }}
                      </el-tag>
                      <span class="text-11px text-[var(--el-text-color-secondary)]">
                        {{ getExampleValue(property) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="mt-12px ml-22px">
                  <div class="text-12px text-[var(--el-text-color-secondary)] mb-6px">
                    完整JSON格式：
                  </div>
                  <pre
                    class="p-12px bg-[var(--el-fill-color-light)] rounded-4px text-11px text-[var(--el-text-color-primary)] overflow-x-auto border-l-3px border-[var(--el-color-primary)]"
                  ><code>{{ generateExampleJson() }}</code></pre>
                </div>
              </div>

              <!-- 通用示例 -->
              <div>
                <div class="flex items-center gap-8px mb-8px">
                  <Icon icon="ep:service" class="text-[var(--el-color-success)] text-14px" />
                  <span class="text-14px font-500 text-[var(--el-text-color-primary)]">
                    通用格式示例
                  </span>
                </div>
                <div class="ml-22px space-y-8px">
                  <div class="text-12px text-[var(--el-text-color-secondary)]">
                    服务调用格式：
                  </div>
                  <pre
                    class="p-12px bg-[var(--el-fill-color-light)] rounded-4px text-11px text-[var(--el-text-color-primary)] overflow-x-auto border-l-3px border-[var(--el-color-success)]"
                  ><code>{
  "method": "restart",
  "params": {
    "delay": 5,
    "force": false
  }
}</code></pre>
                </div>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <div class="flex justify-end mt-16px">
              <el-button size="small" @click="hideExampleDetail">关闭</el-button>
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
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import { ActionFormData, ThingModelService } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneActionTypeEnum } from '@/views/iot/utils/constants'

/** 设备控制配置组件 */
defineOptions({ name: 'DeviceControlConfig' })

const props = defineProps<{
  modelValue: ActionFormData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ActionFormData): void
}>()

const action = useVModel(props, 'modelValue', emit)

const paramsJson = ref('') // 参数JSON字符串
const jsonError = ref('') // JSON格式错误信息
const thingModelProperties = ref<any[]>([]) // 物模型属性列表
const loadingThingModel = ref(false) // 物模型加载状态
const propertyValues = ref<Record<string, any>>({}) // 属性值映射

const selectedService = ref<ThingModelService | null>(null) // 选中的服务对象
const serviceList = ref<ThingModelService[]>([]) // 服务列表
const loadingServices = ref(false) // 服务加载状态

const showExampleDetail = ref(false) // 示例详情弹出层显示状态
const exampleTriggerRef = ref() // 示例触发按钮引用
const exampleDetailRef = ref() // 示例详情弹出层引用
const examplePopoverStyle = ref({}) // 示例弹出层样式

const isPropertySetAction = computed(() => {
  // 是否为属性设置类型
  return action.value.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET
})

const isServiceInvokeAction = computed(() => {
  // 是否为服务调用类型
  return action.value.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
})

/**
 * 处理产品变化事件
 * @param productId 产品ID
 */
const handleProductChange = (productId?: number) => {
  // 当产品变化时，清空设备选择和参数配置
  if (action.value.productId !== productId) {
    action.value.deviceId = undefined
    action.value.identifier = undefined // 清空服务标识符
    action.value.params = {}
    paramsJson.value = ''
    jsonError.value = ''
    propertyValues.value = {}
    selectedService.value = null // 清空选中的服务
    serviceList.value = [] // 清空服务列表
  }

  // 加载新产品的物模型属性或服务列表
  if (productId) {
    if (isPropertySetAction.value) {
      loadThingModelProperties(productId)
    } else if (isServiceInvokeAction.value) {
      loadServiceList(productId)
    }
  }
}

/**
 * 处理设备变化事件
 * @param deviceId 设备ID
 */
const handleDeviceChange = (deviceId?: number) => {
  // 当设备变化时，清空参数配置
  if (action.value.deviceId !== deviceId) {
    action.value.params = {}
    paramsJson.value = ''
    jsonError.value = ''
  }
}

/**
 * 处理服务变化事件
 * @param serviceIdentifier 服务标识符
 */
const handleServiceChange = (serviceIdentifier?: string) => {
  // 根据服务标识符找到对应的服务对象
  const service = serviceList.value.find((s) => s.identifier === serviceIdentifier) || null
  selectedService.value = service

  // 当服务变化时，清空参数配置并根据服务输入参数生成默认参数结构
  action.value.params = {}
  paramsJson.value = ''
  jsonError.value = ''

  // 如果选择了服务且有输入参数，生成默认参数结构
  if (service && service.inputParams && service.inputParams.length > 0) {
    const defaultParams = {}
    service.inputParams.forEach((param) => {
      defaultParams[param.identifier] = getDefaultValueForParam(param)
    })
    action.value.params = defaultParams
    paramsJson.value = JSON.stringify(defaultParams, null, 2)
  }
}

/**
 * 快速填充示例数据
 */
const fillExampleJson = () => {
  const exampleData = generateExampleJson()
  paramsJson.value = exampleData
  handleParamsChange()
}

/**
 * 快速填充服务示例数据
 */
const fillServiceExampleJson = () => {
  if (selectedService.value && selectedService.value.inputParams) {
    const exampleData = generateServiceExampleJson()
    paramsJson.value = exampleData
    handleParamsChange()
  }
}

/**
 * 清空参数
 */
const clearParams = () => {
  paramsJson.value = ''
  action.value.params = {}
  propertyValues.value = {}
  jsonError.value = ''
}

// 更新属性值（保留但不在模板中使用）
// const updatePropertyValue = (identifier: string, value: any) => {
//   propertyValues.value[identifier] = value
//   // 同步更新到 action.params
//   action.value.params = { ...propertyValues.value }
//   // 同步更新 JSON 显示
//   paramsJson.value = JSON.stringify(action.value.params, null, 2)
//   jsonError.value = ''
// }

/**
 * 加载物模型属性
 * @param productId 产品ID
 */
const loadThingModelProperties = async (productId: number) => {
  if (!productId) {
    thingModelProperties.value = []
    return
  }

  try {
    loadingThingModel.value = true
    // TODO: 这里需要调用实际的物模型API
    // const response = await ProductApi.getThingModel(productId)
    // 暂时使用模拟数据
    thingModelProperties.value = [
      {
        identifier: 'BatteryLevel',
        name: '电池电量',
        dataType: 'int',
        description: '设备电池电量百分比'
      },
      {
        identifier: 'WaterLeachState',
        name: '漏水状态',
        dataType: 'bool',
        description: '设备漏水检测状态'
      },
      {
        identifier: 'Temperature',
        name: '温度',
        dataType: 'float',
        description: '环境温度值'
      },
      {
        identifier: 'Humidity',
        name: '湿度',
        dataType: 'float',
        description: '环境湿度值'
      }
    ]

    // 初始化属性值
    thingModelProperties.value.forEach((property) => {
      if (!(property.identifier in propertyValues.value)) {
        propertyValues.value[property.identifier] = ''
      }
    })
  } catch (error) {
    console.error('加载物模型失败:', error)
    thingModelProperties.value = []
  } finally {
    loadingThingModel.value = false
  }
}

/**
 * 加载服务列表
 * @param productId 产品ID
 */
const loadServiceList = async (productId: number) => {
  if (!productId) {
    serviceList.value = []
    return
  }

  loadingServices.value = true
  try {
    const { ThingModelApi } = await import('@/api/iot/thingmodel')
    const tslData = await ThingModelApi.getThingModelTSLByProductId(productId)
    serviceList.value = tslData?.services || []
  } catch (error) {
    console.error('加载服务列表失败:', error)
    serviceList.value = []
  } finally {
    loadingServices.value = false
  }
}

/**
 * 从TSL加载服务信息（用于编辑模式回显）
 * @param productId 产品ID
 * @param serviceIdentifier 服务标识符
 */
const loadServiceFromTSL = async (productId: number, serviceIdentifier: string) => {
  // 先加载服务列表
  await loadServiceList(productId)

  // 然后设置选中的服务
  const service = serviceList.value.find((s: any) => s.identifier === serviceIdentifier)
  if (service) {
    selectedService.value = service
  }
}

/**
 * 处理参数变化事件
 */
const handleParamsChange = () => {
  try {
    jsonError.value = '' // 清除之前的错误

    if (paramsJson.value.trim()) {
      const parsed = JSON.parse(paramsJson.value)
      action.value.params = parsed

      // 同步更新到属性值
      propertyValues.value = { ...parsed }

      // 额外的参数验证
      if (typeof parsed !== 'object' || parsed === null) {
        jsonError.value = '参数必须是一个有效的JSON对象'
        return
      }
    } else {
      action.value.params = {}
      propertyValues.value = {}
    }
  } catch (error) {
    jsonError.value = `JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`
    console.error('JSON格式错误:', error)
  }
}

/**
 * 获取属性类型名称
 * @param dataType 数据类型
 * @returns 类型名称
 */
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

/**
 * 根据参数类型获取默认值
 * @param param 参数对象
 * @returns 默认值
 */
const getDefaultValueForParam = (param: any) => {
  switch (param.dataType) {
    case 'int':
      return 0
    case 'float':
    case 'double':
      return 0.0
    case 'bool':
      return false
    case 'text':
      return ''
    case 'enum':
      // 如果有枚举值，使用第一个
      if (param.dataSpecs?.dataSpecsList && param.dataSpecs.dataSpecsList.length > 0) {
        return param.dataSpecs.dataSpecsList[0].value
      }
      return ''
    default:
      return ''
  }
}

/**
 * 获取属性类型标签样式
 * @param dataType 数据类型
 * @returns 标签类型
 */
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

/**
 * 获取属性示例值
 * @param property 属性对象
 * @returns 示例值
 */
const getExampleValue = (property: any) => {
  switch (property.dataType) {
    case 'int':
      return property.identifier === 'BatteryLevel' ? '85' : '25'
    case 'float':
    case 'double':
      return property.identifier === 'Temperature' ? '25.5' : '60.0'
    case 'bool':
      return 'false'
    case 'text':
      return '"auto"'
    case 'enum':
      return '"option1"'
    default:
      return '""'
  }
}

/**
 * 获取参数示例值
 * @param param 参数对象
 * @returns 示例值
 */
const getExampleValueForParam = (param: any) => {
  switch (param.dataType) {
    case 'int':
      return '0'
    case 'float':
    case 'double':
      return '0.0'
    case 'bool':
      return 'false'
    case 'text':
      return '"text"'
    case 'enum':
      if (param.dataSpecs?.dataSpecsList && param.dataSpecs.dataSpecsList.length > 0) {
        return `"${param.dataSpecs.dataSpecsList[0].name}"`
      }
      return '"option1"'
    default:
      return '""'
  }
}

/**
 * 生成示例JSON
 * @returns JSON字符串
 */
const generateExampleJson = () => {
  if (thingModelProperties.value.length === 0) {
    return JSON.stringify(
      {
        BatteryLevel: '',
        WaterLeachState: ''
      },
      null,
      2
    )
  }

  const example = {}
  thingModelProperties.value.forEach((property) => {
    switch (property.dataType) {
      case 'int':
        example[property.identifier] = property.identifier === 'BatteryLevel' ? 85 : 25
        break
      case 'float':
      case 'double':
        example[property.identifier] = property.identifier === 'Temperature' ? 25.5 : 60.0
        break
      case 'bool':
        example[property.identifier] = false
        break
      case 'text':
        example[property.identifier] = 'auto'
        break
      default:
        example[property.identifier] = ''
    }
  })

  return JSON.stringify(example, null, 2)
}

/**
 * 生成服务示例JSON
 * @returns JSON字符串
 */
const generateServiceExampleJson = () => {
  if (!selectedService.value || !selectedService.value.inputParams) {
    return JSON.stringify({}, null, 2)
  }

  const example = {}
  selectedService.value.inputParams.forEach((param) => {
    example[param.identifier] = getDefaultValueForParam(param)
  })

  return JSON.stringify(example, null, 2)
}

/**
 * 切换示例详情弹出层显示状态
 */
const toggleExampleDetail = () => {
  if (showExampleDetail.value) {
    hideExampleDetail()
  } else {
    showExampleDetailPopover()
  }
}

/**
 * 显示示例详情弹出层
 */
const showExampleDetailPopover = () => {
  if (!exampleTriggerRef.value) return

  showExampleDetail.value = true

  nextTick(() => {
    updateExamplePopoverPosition()
  })
}

/**
 * 隐藏示例详情弹出层
 */
const hideExampleDetail = () => {
  showExampleDetail.value = false
}

/**
 * 更新示例弹出层位置
 */
const updateExamplePopoverPosition = () => {
  if (!exampleTriggerRef.value || !exampleDetailRef.value) return

  const triggerEl = exampleTriggerRef.value.$el
  const triggerRect = triggerEl.getBoundingClientRect()

  // 计算弹出层位置
  const left = triggerRect.left + triggerRect.width + 8
  const top = triggerRect.top

  // 检查是否超出视窗右边界
  const popoverWidth = 500 // 最大宽度
  const viewportWidth = window.innerWidth

  let finalLeft = left
  if (left + popoverWidth > viewportWidth - 16) {
    // 如果超出右边界，显示在左侧
    finalLeft = triggerRect.left - popoverWidth - 8
  }

  // 检查是否超出视窗下边界
  let finalTop = top
  const popoverHeight = exampleDetailRef.value.offsetHeight || 300
  const viewportHeight = window.innerHeight

  if (top + popoverHeight > viewportHeight - 16) {
    finalTop = Math.max(16, viewportHeight - popoverHeight - 16)
  }

  examplePopoverStyle.value = {
    position: 'fixed',
    left: `${finalLeft}px`,
    top: `${finalTop}px`,
    zIndex: 9999
  }
}

/**
 * 点击外部关闭弹出层
 * @param event 鼠标事件
 */
const handleClickOutside = (event: MouseEvent) => {
  if (
    showExampleDetail.value &&
    exampleDetailRef.value &&
    exampleTriggerRef.value &&
    !exampleDetailRef.value.contains(event.target as Node) &&
    !exampleTriggerRef.value.$el.contains(event.target as Node)
  ) {
    hideExampleDetail()
  }
}

/**
 * 监听窗口大小变化，重新计算弹出层位置
 */
const handleResize = () => {
  if (showExampleDetail.value) {
    updateExamplePopoverPosition()
  }
}

/**
 * 组件初始化
 */
onMounted(() => {
  if (action.value.params && Object.keys(action.value.params).length > 0) {
    try {
      paramsJson.value = JSON.stringify(action.value.params, null, 2)
      propertyValues.value = { ...action.value.params }
      jsonError.value = '' // 清除错误状态
    } catch (error) {
      console.error('初始化参数格式化失败:', error)
      jsonError.value = '初始参数格式错误'
    }
  }

  // 如果已经选择了产品且是属性设置类型，加载物模型
  if (action.value.productId && isPropertySetAction.value) {
    loadThingModelProperties(action.value.productId)
  }

  // 如果是服务调用类型且已有标识符，初始化服务选择
  if (action.value.productId && isServiceInvokeAction.value && action.value.identifier) {
    // 加载物模型TSL以获取服务信息
    loadServiceFromTSL(action.value.productId, action.value.identifier)
  }

  // 添加事件监听器
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

/**
 * 组件卸载时清理事件监听器
 */
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})

// 监听参数变化
watch(
  () => action.value.params,
  (newParams) => {
    if (newParams && typeof newParams === 'object' && Object.keys(newParams).length > 0) {
      try {
        const newJsonString = JSON.stringify(newParams, null, 2)
        // 只有当JSON字符串真正改变时才更新，避免循环更新
        if (newJsonString !== paramsJson.value) {
          paramsJson.value = newJsonString
          jsonError.value = ''
        }
      } catch (error) {
        console.error('参数格式化失败:', error)
        jsonError.value = '参数格式化失败'
      }
    } else {
      // 参数为空时清空JSON显示
      if (paramsJson.value !== '') {
        paramsJson.value = ''
        jsonError.value = ''
      }
    }
  },
  { deep: true }
)

// 监听action.value变化，处理编辑模式的数据回显
watch(
  () => action.value,
  async (newAction) => {
    if (newAction) {
      // 处理服务调用的数据回显
      if (isServiceInvokeAction.value && newAction.productId) {
        if (newAction.identifier) {
          // 编辑模式：加载服务信息并设置选中的服务
          await loadServiceFromTSL(newAction.productId, newAction.identifier)
        } else {
          // 新建模式：只加载服务列表
          await loadServiceList(newAction.productId)
        }
      } else if (isServiceInvokeAction.value) {
        // 清空服务选择
        selectedService.value = null
        serviceList.value = []
      }

      // 处理参数回显
      if (newAction.params && Object.keys(newAction.params).length > 0) {
        try {
          const newJsonString = JSON.stringify(newAction.params, null, 2)
          if (paramsJson.value !== newJsonString) {
            paramsJson.value = newJsonString
            propertyValues.value = { ...newAction.params }
            jsonError.value = ''
          }
        } catch (error) {
          console.error('参数格式化失败:', error)
          jsonError.value = '参数格式化失败'
        }
      } else {
        if (paramsJson.value !== '') {
          paramsJson.value = ''
          propertyValues.value = {}
          jsonError.value = ''
        }
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
/* 参考 PropertySelector 的弹出层样式 */
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

.example-detail-popover {
  animation: fadeInScale 0.2s ease-out;
  transform-origin: top left;
}

/* 弹出层箭头效果 */
.example-detail-popover::before {
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

.example-detail-popover::after {
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

:deep(.example-content code) {
  font-family: 'Courier New', monospace;
  color: var(--el-color-primary);
}
</style>
