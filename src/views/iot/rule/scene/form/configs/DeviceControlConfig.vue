<!-- 设备控制配置组件 -->
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
          <JsonParamsInput
            v-model="paramsValue"
            type="service"
            :config="{ service: selectedService }"
            placeholder="请输入JSON格式的服务参数"
            @validate="handleParamsValidate"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 控制参数配置 - 属性设置类型时显示 -->
    <div v-if="action.productId && isPropertySetAction" class="space-y-16px">
      <!-- 参数配置 -->
      <el-form-item label="参数" required>
        <JsonParamsInput
          v-model="paramsValue"
          type="property"
          :config="{ properties: thingModelProperties }"
          placeholder="请输入JSON格式的控制参数"
          @validate="handleParamsValidate"
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import JsonParamsInput from '../inputs/JsonParamsInput.vue'
import { Action, ThingModelService } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneActionTypeEnum } from '@/views/iot/utils/constants'

/** 设备控制配置组件 */
defineOptions({ name: 'DeviceControlConfig' })

const props = defineProps<{
  modelValue: Action
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Action): void
}>()

const action = useVModel(props, 'modelValue', emit)

// 简化后的状态变量
const thingModelProperties = ref<any[]>([]) // 物模型属性列表
const loadingThingModel = ref(false) // 物模型加载状态
const selectedService = ref<ThingModelService | null>(null) // 选中的服务对象
const serviceList = ref<ThingModelService[]>([]) // 服务列表
const loadingServices = ref(false) // 服务加载状态

// 参数值的计算属性，用于双向绑定
const paramsValue = computed({
  get: () => {
    if (action.value.params && typeof action.value.params === 'object') {
      return JSON.stringify(action.value.params, null, 2)
    }
    return ''
  },
  set: (value: string) => {
    try {
      if (value.trim()) {
        action.value.params = JSON.parse(value)
      } else {
        action.value.params = {}
      }
    } catch (error) {
      console.error('JSON解析错误:', error)
    }
  }
})

// 参数验证处理
const handleParamsValidate = (result: { valid: boolean; message: string }) => {
  // 可以在这里处理验证结果，比如显示错误信息
  console.log('参数验证结果:', result)
}

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

  // 当服务变化时，清空参数配置
  action.value.params = {}

  // 如果选择了服务且有输入参数，生成默认参数结构
  if (service && service.inputParams && service.inputParams.length > 0) {
    const defaultParams = {}
    service.inputParams.forEach((param) => {
      defaultParams[param.identifier] = getDefaultValueForParam(param)
    })
    action.value.params = defaultParams
  }
}

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

    // 属性加载完成，无需额外初始化
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
 * 组件初始化
 */
onMounted(() => {
  // 如果已经选择了产品且是属性设置类型，加载物模型
  if (action.value.productId && isPropertySetAction.value) {
    loadThingModelProperties(action.value.productId)
  }

  // 如果是服务调用类型且已有标识符，初始化服务选择
  if (action.value.productId && isServiceInvokeAction.value && action.value.identifier) {
    // 加载物模型TSL以获取服务信息
    loadServiceFromTSL(action.value.productId, action.value.identifier)
  }
})

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
    }
  },
  { deep: true, immediate: true }
)
</script>
