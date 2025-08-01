<template>
  <!-- 场景联动规则表单抽屉 - 优化高度和布局 -->
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
      <TriggerSection v-model:triggers="formData.triggers" @validate="handleTriggerValidate" />

      <!-- 执行器配置 -->
      <ActionSection v-model:actions="formData.actions" @validate="handleActionValidate" />
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
import { IotRuleSceneDO, RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'
import { IotRuleSceneTriggerTypeEnum } from '@/views/iot/utils/constants'
import { ElMessage } from 'element-plus'
import { generateUUID } from '@/utils'

// 导入全局的 CommonStatusEnum
const CommonStatusEnum = {
  ENABLE: 0, // 开启
  DISABLE: 1 // 关闭
} as const

/** IoT 场景联动规则表单 - 主表单组件 */
defineOptions({ name: 'RuleSceneForm' })

/** 组件属性定义 */
const props = defineProps<{
  /** 抽屉显示状态 */
  modelValue: boolean
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
 * 将表单数据转换为后端 DO 格式
 * 由于数据结构已对齐，转换变得非常简单
 */
const convertFormToVO = (formData: RuleSceneFormData): IotRuleSceneDO => {
  return {
    id: formData.id,
    name: formData.name,
    description: formData.description,
    status: Number(formData.status),
    triggers: formData.triggers.map((trigger) => ({
      type: trigger.type,
      productId: trigger.productId,
      deviceId: trigger.deviceId,
      identifier: trigger.identifier,
      operator: trigger.operator,
      value: trigger.value,
      cronExpression: trigger.cronExpression,
      conditionGroups: trigger.conditionGroups || []
    })),
    actions:
      formData.actions?.map((action) => ({
        type: action.type,
        productId: action.productId,
        deviceId: action.deviceId,
        params: action.params,
        alertConfigId: action.alertConfigId
      })) || []
  }
}

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
  triggers: [
    { required: true, message: '触发器数组不能为空', trigger: 'change' },
    { type: 'array', min: 1, message: '至少需要一个触发器', trigger: 'change' }
  ],
  actions: [
    { required: true, message: '执行器数组不能为空', trigger: 'change' },
    { type: 'array', min: 1, message: '至少需要一个执行器', trigger: 'change' }
  ]
})

const submitLoading = ref(false)

// 验证状态
const triggerValidation = ref({ valid: true, message: '' })
const actionValidation = ref({ valid: true, message: '' })

// 计算属性
const isEdit = ref(false)
const drawerTitle = computed(() => (isEdit.value ? '编辑场景联动规则' : '新增场景联动规则'))

// 事件处理
const handleTriggerValidate = (result: { valid: boolean; message: string }) => {
  triggerValidation.value = result
}

const handleActionValidate = (result: { valid: boolean; message: string }) => {
  actionValidation.value = result
}

const handleSubmit = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 验证触发器和执行器
  if (!triggerValidation.value.valid) {
    ElMessage.error(triggerValidation.value.message)
    return
  }
  if (!actionValidation.value.valid) {
    ElMessage.error(actionValidation.value.message)
    return
  }

  // 提交请求
  submitLoading.value = true
  try {
    console.log(formData.value)
    // 转换数据格式
    const apiData = convertFormToVO(formData.value)
    if (true) {
      console.log('转换后', apiData)
      return
    }
    // 调用API保存数据
    if (isEdit.value) {
      // 更新场景联动规则
      // await RuleSceneApi.updateRuleScene(apiData)
      console.log('更新数据:', apiData)
    } else {
      // 创建场景联动规则
      // await RuleSceneApi.createRuleScene(apiData)
      console.log('创建数据:', apiData)
    }

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
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
  // TODO @puhui999: 编辑的情况后面实现
  formData.value = createDefaultFormData()
}

// 监听抽屉显示
watch(drawerVisible, (visible) => {
  if (visible) {
    initFormData()
    // TODO @puhui999: 重置表单的情况
    // nextTick(() => {
    //   formRef.value?.clearValidate()
    // })
  }
})

// 监听 props 变化
// watch(
//   () => props.ruleScene,
//   () => {
//     if (drawerVisible.value) {
//       initFormData()
//     }
//   }
// )
</script>
