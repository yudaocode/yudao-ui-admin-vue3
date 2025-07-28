<template>
  <!-- TODO @puhui999：这个抽屉的高度太高了？！ -->
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="80%"
    direction="rtl"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
    class="[--el-drawer-padding-primary:20px]"
  >
    <div class="h-[calc(100vh-120px)] overflow-y-auto p-20px pb-80px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="flex flex-col gap-24px"
      >
        <!-- 基础信息配置 -->
        <BasicInfoSection v-model="formData" :rules="formRules" />

        <!-- 触发器配置 -->
        <TriggerSection v-model:trigger="formData.trigger" @validate="handleTriggerValidate" />

        <!-- 执行器配置 -->
        <ActionSection v-model:actions="formData.actions" @validate="handleActionValidate" />
      </el-form>
    </div>
    <template #footer>
      <el-button :disabled="submitLoading" type="primary" @click="handleSubmit">确 定</el-button>
      <el-button @click="handleClose">取 消</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import BasicInfoSection from './sections/BasicInfoSection.vue'
import TriggerSection from './sections/TriggerSection.vue'
import ActionSection from './sections/ActionSection.vue'
import {
  RuleSceneFormData,
  IotRuleScene,
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerTypeEnum,
  CommonStatusEnum
} from '@/api/iot/rule/scene/scene.types'
import { getBaseValidationRules } from '../utils/validation'
import { ElMessage } from 'element-plus'
import { generateUUID } from '@/utils'

/** IoT 场景联动规则表单 - 主表单组件 */
defineOptions({ name: 'RuleSceneForm' })

// TODO @puhui999：是不是融合到 props
interface Props {
  modelValue: boolean
  ruleScene?: IotRuleScene
}

// TODO @puhui999：Emits 是不是融合到 emit
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const drawerVisible = useVModel(props, 'modelValue', emit) // 是否可见

// TODO @puhui999：使用 /** 注释风格哈 */

/** 创建默认的表单数据 */
const createDefaultFormData = (): RuleSceneFormData => {
  return {
    name: '',
    description: '',
    status: CommonStatusEnum.ENABLE, // 默认启用状态
    trigger: {
      type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
      productId: undefined,
      deviceId: undefined,
      identifier: undefined,
      operator: undefined,
      value: undefined,
      cronExpression: undefined,
      mainCondition: undefined,
      conditionGroup: undefined
    },
    actions: []
  }
}

// TODO @puhui999：使用 convertFormToVO；下面也是类似哈；
/**
 * 将表单数据转换为 API 请求格式
 */
const transformFormToApi = (formData: RuleSceneFormData): IotRuleScene => {
  return {
    id: formData.id,
    name: formData.name,
    description: formData.description,
    status: Number(formData.status),
    triggers: [
      {
        type: formData.trigger.type,
        productKey: formData.trigger.productId
          ? `product_${formData.trigger.productId}`
          : undefined,
        deviceNames: formData.trigger.deviceId
          ? [`device_${formData.trigger.deviceId}`]
          : undefined,
        cronExpression: formData.trigger.cronExpression,
        conditions: [] // TODO: 实现新的条件转换逻辑
      }
    ],
    actions:
      formData.actions?.map((action) => ({
        type: action.type,
        alertConfigId: action.alertConfigId,
        deviceControl:
          action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
          action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
            ? {
                productKey: action.productId ? `product_${action.productId}` : '',
                deviceNames: action.deviceId ? [`device_${action.deviceId}`] : [],
                type: 'property',
                identifier: 'set',
                params: action.params || {}
              }
            : undefined
      })) || []
  } as IotRuleScene
}

/**
 * 将 API 响应数据转换为表单格式
 */
const transformApiToForm = (apiData: IotRuleScene): RuleSceneFormData => {
  const firstTrigger = apiData.triggers?.[0]
  return {
    ...apiData,
    status: Number(apiData.status), // 确保状态为数字类型
    trigger: firstTrigger
      ? {
          ...firstTrigger,
          type: Number(firstTrigger.type)
        }
      : {
          type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
          productId: undefined,
          deviceId: undefined,
          identifier: undefined,
          operator: undefined,
          value: undefined,
          cronExpression: undefined,
          mainCondition: undefined,
          conditionGroup: undefined
        },
    actions:
      apiData.actions?.map((action) => ({
        ...action,
        type: Number(action.type),
        // 为每个执行器添加唯一标识符，解决组件索引重用问题
        key: generateUUID()
      })) || []
  }
}

// 表单数据和状态
const formRef = ref()
const formData = ref<RuleSceneFormData>(createDefaultFormData())
const formRules = getBaseValidationRules()
const submitLoading = ref(false)

// 验证状态
const triggerValidation = ref({ valid: true, message: '' })
const actionValidation = ref({ valid: true, message: '' })

// 计算属性
const isEdit = computed(() => !!props.ruleScene?.id)
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
    // 转换数据格式
    const apiData = transformFormToApi(formData.value)

    // 这里应该调用API保存数据
    // TODO @puhui999：貌似还没接入
    console.log('提交数据:', apiData)

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000))

    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    drawerVisible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}

const handleClose = () => {
  drawerVisible.value = false
}

// 初始化表单数据
const initFormData = () => {
  if (props.ruleScene) {
    formData.value = transformApiToForm(props.ruleScene)
  } else {
    formData.value = createDefaultFormData()
  }
}

// 监听抽屉显示
watch(drawerVisible, (visible) => {
  if (visible) {
    initFormData()
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
})

// 监听 props 变化
watch(
  () => props.ruleScene,
  () => {
    if (drawerVisible.value) {
      initFormData()
    }
  }
)
</script>

<!-- TODO @puhui999：看看下面样式，哪些是必要添加的 -->
<style scoped>
/* 滚动条样式 */
.h-\[calc\(100vh-120px\)\]::-webkit-scrollbar {
  width: 6px;
}

.h-\[calc\(100vh-120px\)\]::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

.h-\[calc\(100vh-120px\)\]::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.h-\[calc\(100vh-120px\)\]::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}

/* 抽屉内容区域优化 */
:deep(.el-drawer__body) {
  padding: 0;
  position: relative;
}

:deep(.el-drawer__header) {
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 0;
}

:deep(.el-drawer__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-drawer {
    --el-drawer-size: 100% !important;
  }

  .h-\[calc\(100vh-120px\)\] {
    padding: 16px;
    padding-bottom: 80px;
  }

  .flex.flex-col.gap-24px {
    gap: 20px;
  }

  .absolute.bottom-0 {
    padding: 12px 16px;
    gap: 12px;
  }
}
</style>
