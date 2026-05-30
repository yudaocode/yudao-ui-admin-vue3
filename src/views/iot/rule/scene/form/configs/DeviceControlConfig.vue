<!-- 设备控制配置组件 -->
<template>
  <el-form
    ref="innerFormRef"
    :model="action"
    :rules="formRules"
    label-width="110px"
    class="flex flex-col gap-16px"
  >
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="产品" prop="productId" required>
          <ProductSelector v-model="action.productId" @change="handleProductChange" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备" prop="deviceId" required>
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
      <el-form-item label="服务" prop="identifier" required>
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

      <div v-if="action.identifier" class="space-y-16px">
        <el-form-item label="服务参数" prop="params" required>
          <JsonParamsInput
            v-model="paramsValue"
            type="service"
            :config="{ service: selectedService } as any"
            placeholder="请输入 JSON 格式的服务参数"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 控制参数配置 - 属性设置类型时显示 -->
    <div v-if="action.productId && isPropertySetAction" class="space-y-16px">
      <el-form-item label="参数" prop="params" required>
        <JsonParamsInput
          v-model="paramsValue"
          type="property"
          :config="{ properties: thingModelProperties }"
          placeholder="请输入 JSON 格式的控制参数"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { useVModel } from '@vueuse/core'
import ProductSelector from '../selectors/ProductSelector.vue'
import DeviceSelector from '../selectors/DeviceSelector.vue'
import JsonParamsInput from '../inputs/JsonParamsInput.vue'
import type { Action } from '@/api/iot/rule/scene'
import type { ThingModelProperty, ThingModelService } from '@/api/iot/thingmodel'
import {
  IotRuleSceneActionTypeEnum,
  IoTThingModelAccessModeEnum,
  IoTDataSpecsDataTypeEnum
} from '@/views/iot/utils/constants'
import { ThingModelApi } from '@/api/iot/thingmodel'
import { buildDeviceControlRules } from '@/views/iot/utils/sceneRule'

/** 设备控制配置组件 */
defineOptions({ name: 'DeviceControlConfig' })

const props = defineProps<{
  modelValue: Action
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Action): void
}>()

const action = useVModel(props, 'modelValue', emit)
const innerFormRef = ref<FormInstance>()

const formRules = computed(() => {
  const rules = buildDeviceControlRules(action.value.type)

  if (isServiceInvokeAction.value) {
    if (!action.value.productId) {
      delete rules.identifier
      delete rules.params
    } else if (!action.value.identifier) {
      delete rules.params
    }
  }

  if (isPropertySetAction.value && !action.value.productId) {
    delete rules.params
  }

  return rules
})

const thingModelProperties = ref<ThingModelProperty[]>([])
const loadingThingModel = ref(false)
const selectedService = ref<ThingModelService | null>(null)
const serviceList = ref<ThingModelService[]>([])
const loadingServices = ref(false)

const paramsValue = computed({
  get: () => {
    if (action.value.params && typeof action.value.params === 'object') {
      return JSON.stringify(action.value.params, null, 2)
    }
    return action.value.params || ''
  },
  set: (value: string) => {
    action.value.params = value.trim() || ''
    nextTick(() => {
      innerFormRef.value?.validateField('params').catch(() => {})
    })
  }
})

const isPropertySetAction = computed(() => {
  return action.value.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET
})

const isServiceInvokeAction = computed(() => {
  return action.value.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
})

const validateField = (field: string) => {
  nextTick(() => {
    innerFormRef.value?.validateField(field).catch(() => {})
  })
}

const handleProductChange = (productId?: number) => {
  if (action.value.productId !== productId) {
    action.value.deviceId = undefined
    action.value.identifier = undefined
    action.value.params = ''
    selectedService.value = null
    serviceList.value = []
  }

  if (productId) {
    if (isPropertySetAction.value) {
      loadThingModelProperties(productId)
    } else if (isServiceInvokeAction.value) {
      loadServiceList(productId)
    }
  }

  validateField('productId')
  nextTick(() => {
    innerFormRef.value?.clearValidate(['deviceId', 'identifier', 'params'])
  })
}

const handleDeviceChange = (deviceId?: number) => {
  if (action.value.deviceId !== deviceId) {
    action.value.params = ''
  }
  validateField('deviceId')
}

const handleServiceChange = (serviceIdentifier?: string) => {
  const service = serviceList.value.find((s) => s.identifier === serviceIdentifier) || null
  selectedService.value = service
  action.value.params = ''

  if (service && service.inputParams && service.inputParams.length > 0) {
    const defaultParams: Record<string, unknown> = {}
    service.inputParams.forEach((param) => {
      defaultParams[param.identifier] = getDefaultValueForParam(param)
    })
    action.value.params = JSON.stringify(defaultParams, null, 2)
  }

  validateField('identifier')
  validateField('params')
}

const getThingModelTSL = async (productId: number) => {
  if (!productId) return null

  try {
    return await ThingModelApi.getThingModelTSLByProductId(productId)
  } catch (error) {
    console.error('获取物模型TSL数据失败:', error)
    return null
  }
}

const loadThingModelProperties = async (productId: number) => {
  if (!productId) {
    thingModelProperties.value = []
    return
  }

  try {
    loadingThingModel.value = true
    const tslData = await getThingModelTSL(productId)

    if (!tslData?.properties) {
      thingModelProperties.value = []
      return
    }

    thingModelProperties.value = tslData.properties.filter(
      (property: ThingModelProperty) =>
        property.accessMode &&
        (property.accessMode === IoTThingModelAccessModeEnum.READ_WRITE.value ||
          property.accessMode === IoTThingModelAccessModeEnum.WRITE_ONLY.value)
    )
  } catch (error) {
    console.error('加载物模型属性失败:', error)
    thingModelProperties.value = []
  } finally {
    loadingThingModel.value = false
  }
}

const loadServiceList = async (productId: number) => {
  if (!productId) {
    serviceList.value = []
    return
  }

  try {
    loadingServices.value = true
    const tslData = await getThingModelTSL(productId)

    if (!tslData?.services) {
      serviceList.value = []
      return
    }

    serviceList.value = tslData.services
  } catch (error) {
    console.error('加载服务列表失败:', error)
    serviceList.value = []
  } finally {
    loadingServices.value = false
  }
}

const loadServiceFromTSL = async (productId: number, serviceIdentifier: string) => {
  await loadServiceList(productId)
  const service = serviceList.value.find((s) => s.identifier === serviceIdentifier)
  if (service) {
    selectedService.value = service
  }
}

const getDefaultValueForParam = (param: any) => {
  switch (param.dataType) {
    case IoTDataSpecsDataTypeEnum.INT:
      return 0
    case IoTDataSpecsDataTypeEnum.FLOAT:
    case IoTDataSpecsDataTypeEnum.DOUBLE:
      return 0.0
    case IoTDataSpecsDataTypeEnum.BOOL:
      return false
    case IoTDataSpecsDataTypeEnum.TEXT:
      return ''
    case IoTDataSpecsDataTypeEnum.ENUM:
      if (param.dataSpecs?.dataSpecsList && param.dataSpecs.dataSpecsList.length > 0) {
        return param.dataSpecs.dataSpecsList[0].value
      }
      return ''
    default:
      return ''
  }
}

const isInitialized = ref(false)

const initializeComponent = async () => {
  if (isInitialized.value) return

  const currentAction = action.value
  if (!currentAction) return

  if (currentAction.productId && isPropertySetAction.value) {
    await loadThingModelProperties(currentAction.productId)
  }

  if (currentAction.productId && isServiceInvokeAction.value && currentAction.identifier) {
    await loadServiceFromTSL(currentAction.productId, currentAction.identifier)
  }

  isInitialized.value = true
}

const validate = async (): Promise<boolean> => {
  if (!innerFormRef.value) {
    return true
  }
  try {
    await innerFormRef.value.validate()
    return true
  } catch {
    return false
  }
}

const clearValidate = () => {
  innerFormRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate })

onMounted(() => {
  initializeComponent()
})

watch(
  () => [action.value.productId, action.value.type, action.value.identifier],
  async ([newProductId, , newIdentifier], [oldProductId, , oldIdentifier]) => {
    if (!isInitialized.value) return

    if (newProductId !== oldProductId) {
      if (newProductId && isPropertySetAction.value) {
        await loadThingModelProperties(newProductId as number)
      } else if (newProductId && isServiceInvokeAction.value) {
        await loadServiceList(newProductId as number)
      }
    }

    if (
      newIdentifier !== oldIdentifier &&
      newProductId &&
      isServiceInvokeAction.value &&
      newIdentifier
    ) {
      const service = serviceList.value.find((s) => s.identifier === newIdentifier)
      if (service) {
        selectedService.value = service
      }
    }
  }
)

watch(
  () => action.value.type,
  () => nextTick(() => clearValidate())
)
</script>
