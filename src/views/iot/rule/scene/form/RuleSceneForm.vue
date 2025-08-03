<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="80%"
    direction="rtl"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
      <!-- 基础信息配置 -->
      <BasicInfoSection v-model="formData" :rules="formRules" />
      <!-- 触发器配置 -->
      <TriggerSection v-model:triggers="formData.triggers" />
      <!-- 执行器配置 -->
      <ActionSection v-model:actions="formData.actions" />
    </el-form>
    <template #footer>
      <div class="drawer-footer">
        <el-button :disabled="submitLoading" type="primary" @click="handleSubmit">
          <Icon icon="ep:check" />
          确 定
        </el-button>
        <el-button @click="handleClose">
          <Icon icon="ep:close" />
          取 消
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import BasicInfoSection from './sections/BasicInfoSection.vue'
import TriggerSection from './sections/TriggerSection.vue'
import ActionSection from './sections/ActionSection.vue'
import { IotRuleScene, IotRuleSceneDO, RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'
import { RuleSceneApi } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  IotDeviceMessageTypeEnum,
  isDeviceTrigger
} from '@/views/iot/utils/constants'
import { ElMessage } from 'element-plus'
import { generateUUID } from '@/utils'

// 导入全局的 CommonStatusEnum
// TODO @puhui999：这里直接复用全局的哈；
const CommonStatusEnum = {
  ENABLE: 0, // 开启
  DISABLE: 1 // 关闭
} as const

// 工具函数：根据触发器类型获取消息类型
const getMessageTypeByTriggerType = (triggerType: number): string => {
  switch (triggerType) {
    case IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST:
      return IotDeviceMessageTypeEnum.PROPERTY
    case IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST:
      return IotDeviceMessageTypeEnum.EVENT
    case IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE:
      return IotDeviceMessageTypeEnum.SERVICE
    default:
      return IotDeviceMessageTypeEnum.PROPERTY
  }
}

// 工具函数：根据执行器类型获取消息类型
const getMessageTypeByActionType = (actionType: number): string => {
  switch (actionType) {
    case IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET:
      return IotDeviceMessageTypeEnum.PROPERTY
    case IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE:
      return IotDeviceMessageTypeEnum.SERVICE
    default:
      return IotDeviceMessageTypeEnum.PROPERTY
  }
}

// 工具函数：根据执行器类型和参数获取标识符
const getIdentifierByActionType = (actionType: number, params?: Record<string, any>): string => {
  if (!params) return ''

  switch (actionType) {
    case IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET:
      // 属性设置：取第一个属性名作为标识符
      return Object.keys(params)[0] || ''
    case IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE:
      // 服务调用：取 method 字段作为标识符
      return params.method || ''
    default:
      return ''
  }
}

// 工具函数：判断是否为设备执行器
const isDeviceAction = (type: number): boolean => {
  const deviceActionTypes = [
    IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ] as number[]
  return deviceActionTypes.includes(type)
}

/** IoT 场景联动规则表单 - 主表单组件 */
defineOptions({ name: 'RuleSceneForm' })

/** 组件属性定义 */
const props = defineProps<{
  /** 抽屉显示状态 */
  modelValue: boolean
  /** 编辑的场景联动规则数据 */
  ruleScene?: IotRuleSceneDO
}>()

/** 组件事件定义 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const drawerVisible = useVModel(props, 'modelValue', emit) // 是否可见

/** 创建默认的表单数据 */
const createDefaultFormData = (): RuleSceneFormData => {
  return {
    name: '',
    description: '',
    status: CommonStatusEnum.ENABLE, // 默认启用状态
    triggers: [
      {
        type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
        productId: undefined,
        deviceId: undefined,
        identifier: undefined,
        operator: undefined,
        value: undefined,
        cronExpression: undefined,
        conditionGroups: [] // 空的条件组数组
      }
    ],
    actions: []
  }
}

/**
 * 将表单数据转换为后端 API 格式
 * 转换为 IotRuleScene 格式，与后端 API 接口对齐
 */
const convertFormToVO = (formData: RuleSceneFormData): IotRuleScene => {
  return {
    id: formData.id,
    name: formData.name,
    description: formData.description,
    status: Number(formData.status),
    triggers: formData.triggers.map((trigger) => ({
      key: generateUUID(), // 为每个触发器生成唯一标识
      type: trigger.type,
      productKey: trigger.productId ? `product_${trigger.productId}` : undefined, // 转换为产品标识
      deviceNames: trigger.deviceId ? [`device_${trigger.deviceId}`] : undefined, // 转换为设备名称数组
      conditions: trigger.identifier
        ? [
            {
              type: getMessageTypeByTriggerType(trigger.type),
              identifier: trigger.identifier,
              parameters: [
                {
                  identifier: trigger.identifier,
                  operator: trigger.operator || '=',
                  value: trigger.value || ''
                }
              ]
            }
          ]
        : undefined,
      cronExpression: trigger.cronExpression
    })),
    actions:
      formData.actions?.map((action) => ({
        key: generateUUID(), // 为每个执行器生成唯一标识
        type: action.type,
        deviceControl: isDeviceAction(action.type)
          ? {
              productKey: action.productId ? `product_${action.productId}` : '',
              deviceNames: action.deviceId ? [`device_${action.deviceId}`] : [],
              type: getMessageTypeByActionType(action.type),
              identifier: getIdentifierByActionType(action.type, action.params),
              params: action.params || {}
            }
          : undefined,
        alertConfigId: action.alertConfigId
      })) || []
  }
}

// TODO @puhui999：下面好像没用到？
/**
 * 将后端 DO 数据转换为表单格式
 * 由于数据结构已对齐，转换变得非常简单
 */
const convertVOToForm = (apiData: IotRuleSceneDO): RuleSceneFormData => {
  // 转换所有触发器
  const triggers = apiData.triggers?.length
    ? apiData.triggers.map((trigger: any) => ({
        type: Number(trigger.type),
        productId: trigger.productId,
        deviceId: trigger.deviceId,
        identifier: trigger.identifier,
        operator: trigger.operator,
        value: trigger.value,
        cronExpression: trigger.cronExpression,
        conditionGroups: trigger.conditionGroups || []
      }))
    : [
        {
          type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
          productId: undefined,
          deviceId: undefined,
          identifier: undefined,
          operator: undefined,
          value: undefined,
          cronExpression: undefined,
          conditionGroups: []
        }
      ]

  return {
    id: apiData.id,
    name: apiData.name,
    description: apiData.description,
    status: Number(apiData.status),
    triggers,
    actions:
      apiData.actions?.map((action: any) => ({
        type: Number(action.type),
        productId: action.productId,
        deviceId: action.deviceId,
        params: action.params || {},
        alertConfigId: action.alertConfigId,
        // 为每个执行器添加唯一标识符，解决组件索引重用问题
        key: generateUUID()
      })) || []
  }
}

// 表单数据和状态
const formRef = ref()
const formData = ref<RuleSceneFormData>(createDefaultFormData())
// 自定义校验器
const validateTriggers = (rule: any, value: any, callback: any) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个触发器'))
    return
  }

  for (let i = 0; i < value.length; i++) {
    const trigger = value[i]

    // 校验触发器类型
    if (!trigger.type) {
      callback(new Error(`触发器 ${i + 1}: 触发器类型不能为空`))
      return
    }

    // 校验设备触发器
    if (isDeviceTrigger(trigger.type)) {
      if (!trigger.productId) {
        callback(new Error(`触发器 ${i + 1}: 产品不能为空`))
        return
      }
      if (!trigger.deviceId) {
        callback(new Error(`触发器 ${i + 1}: 设备不能为空`))
        return
      }
      if (!trigger.identifier) {
        callback(new Error(`触发器 ${i + 1}: 物模型标识符不能为空`))
        return
      }
      if (!trigger.operator) {
        callback(new Error(`触发器 ${i + 1}: 操作符不能为空`))
        return
      }
      if (trigger.value === undefined || trigger.value === null || trigger.value === '') {
        callback(new Error(`触发器 ${i + 1}: 参数值不能为空`))
        return
      }
    }

    // 校验定时触发器
    if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
      if (!trigger.cronExpression) {
        callback(new Error(`触发器 ${i + 1}: CRON表达式不能为空`))
        return
      }
    }
  }

  callback()
}

const validateActions = (rule: any, value: any, callback: any) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个执行器'))
    return
  }

  for (let i = 0; i < value.length; i++) {
    const action = value[i]

    // 校验执行器类型
    if (!action.type) {
      callback(new Error(`执行器 ${i + 1}: 执行器类型不能为空`))
      return
    }

    // 校验设备控制执行器
    if (
      action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
      action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      if (!action.productId) {
        callback(new Error(`执行器 ${i + 1}: 产品不能为空`))
        return
      }
      if (!action.deviceId) {
        callback(new Error(`执行器 ${i + 1}: 设备不能为空`))
        return
      }
      if (!action.params || Object.keys(action.params).length === 0) {
        callback(new Error(`执行器 ${i + 1}: 参数配置不能为空`))
        return
      }
    }

    // 校验告警执行器
    if (
      action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER ||
      action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER
    ) {
      if (!action.alertConfigId) {
        callback(new Error(`执行器 ${i + 1}: 告警配置不能为空`))
        return
      }
    }
  }

  callback()
}

const formRules = reactive({
  name: [
    { required: true, message: '场景名称不能为空', trigger: 'blur' },
    { type: 'string', min: 1, max: 50, message: '场景名称长度应在1-50个字符之间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '场景状态不能为空', trigger: 'change' },
    {
      type: 'enum',
      enum: [CommonStatusEnum.ENABLE, CommonStatusEnum.DISABLE],
      message: '状态值必须为启用或禁用',
      trigger: 'change'
    }
  ],
  description: [
    { type: 'string', max: 200, message: '场景描述不能超过200个字符', trigger: 'blur' }
  ],
  triggers: [{ required: true, validator: validateTriggers, trigger: 'change' }],
  actions: [{ required: true, validator: validateActions, trigger: 'change' }]
})

const submitLoading = ref(false)

// 计算属性
const isEdit = ref(false)
const drawerTitle = computed(() => (isEdit.value ? '编辑场景联动规则' : '新增场景联动规则'))

/** 提交表单 */
const handleSubmit = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 提交请求
  submitLoading.value = true
  try {
    // 转换数据格式
    const apiData = convertFormToVO(formData.value)
    console.log('提交数据:', apiData)

    // 调用API保存数据
    if (isEdit.value) {
      // 更新场景联动规则
      await RuleSceneApi.updateRuleScene(apiData)
      ElMessage.success('更新成功')
    } else {
      // 创建场景联动规则
      await RuleSceneApi.createRuleScene(apiData)
      ElMessage.success('创建成功')
    }

    // 关闭抽屉并触发成功事件
    drawerVisible.value = false
    emit('success')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

const handleClose = () => {
  drawerVisible.value = false
}

/** 初始化表单数据 */
const initFormData = () => {
  if (props.ruleScene) {
    // 编辑模式：转换后端数据为表单格式
    isEdit.value = true
    formData.value = convertVOToForm(props.ruleScene)
  } else {
    // 新增模式：使用默认数据
    isEdit.value = false
    formData.value = createDefaultFormData()
  }
}

// 监听抽屉显示
watch(drawerVisible, (visible) => {
  if (visible) {
    initFormData()
    // 重置表单验证状态
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
})

// 监听编辑数据变化
watch(
  () => props.ruleScene,
  () => {
    if (drawerVisible.value) {
      initFormData()
    }
  },
  { deep: true }
)
</script>
