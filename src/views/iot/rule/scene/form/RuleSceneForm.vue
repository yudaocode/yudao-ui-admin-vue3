<!-- IoT场景联动规则表单 - 主表单组件 -->
<template>
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
        <TriggerSection v-model:triggers="formData.triggers" @validate="handleTriggerValidate" />

        <!-- 执行器配置 -->
        <ActionSection v-model:actions="formData.actions" @validate="handleActionValidate" />

        <!-- 预览区域 -->
        <PreviewSection
          :form-data="formData"
          :validation-result="validationResult"
          @validate="handleValidate"
        />
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
import PreviewSection from './sections/PreviewSection.vue'
import { RuleSceneFormData, IotRuleScene } from '@/api/iot/rule/scene/scene.types'
import { getBaseValidationRules } from '../utils/validation'
import { transformFormToApi, transformApiToForm, createDefaultFormData } from '../utils/transform'
import { ElMessage } from 'element-plus'

/** IoT 场景联动规则表单 - 主表单组件 */
defineOptions({ name: 'RuleSceneForm' })

interface Props {
  modelValue: boolean
  ruleScene?: IotRuleScene
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const drawerVisible = useVModel(props, 'modelValue', emit)

// 表单数据和状态
const formRef = ref()
const formData = ref<RuleSceneFormData>(createDefaultFormData())
const formRules = getBaseValidationRules()
const submitLoading = ref(false)
const validationResult = ref<{ valid: boolean; message?: string } | null>(null)

// 验证状态
const triggerValidation = ref({ valid: true, message: '' })
const actionValidation = ref({ valid: true, message: '' })

// 计算属性
const isEdit = computed(() => !!props.ruleScene?.id)
const drawerTitle = computed(() => (isEdit.value ? '编辑场景联动规则' : '新增场景联动规则'))

const canSubmit = computed(() => {
  return (
    formData.value.name &&
    formData.value.triggers.length > 0 &&
    formData.value.actions.length > 0 &&
    triggerValidation.value.valid &&
    actionValidation.value.valid
  )
})

// 事件处理
const handleTriggerValidate = (result: { valid: boolean; message: string }) => {
  triggerValidation.value = result
}

const handleActionValidate = (result: { valid: boolean; message: string }) => {
  actionValidation.value = result
}

const handleValidate = async () => {
  try {
    await formRef.value?.validate()

    if (!triggerValidation.value.valid) {
      throw new Error(triggerValidation.value.message)
    }

    if (!actionValidation.value.valid) {
      throw new Error(actionValidation.value.message)
    }

    validationResult.value = { valid: true, message: '验证通过' }
    ElMessage.success('规则验证通过')
    return true
  } catch (error: any) {
    const message = error.message || '表单验证失败'
    validationResult.value = { valid: false, message }
    ElMessage.error(message)
    return false
  }
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
  validationResult.value = null
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

// 监听props变化
watch(
  () => props.ruleScene,
  () => {
    if (drawerVisible.value) {
      initFormData()
    }
  }
)
</script>

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
