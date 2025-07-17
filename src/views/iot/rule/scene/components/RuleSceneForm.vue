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
    class="rule-scene-drawer"
  >
    <div class="rule-scene-form">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="form-container"
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

    <!-- 抽屉底部操作栏 -->
    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose" size="large">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
          :disabled="!canSubmit"
          size="large"
        >
          {{ isEdit ? '更新' : '创建' }}
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
import PreviewSection from './sections/PreviewSection.vue'
import { RuleSceneFormData, IotRuleScene } from '@/api/iot/rule/scene/scene.types'
import { getBaseValidationRules } from '../utils/validation'
import { transformFormToApi, transformApiToForm, createDefaultFormData } from '../utils/transform'
import { handleValidationError, showSuccess, withErrorHandling } from '../utils/errorHandler'

/** IoT场景联动规则表单 - 主表单组件 */
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
    showSuccess('规则验证通过')
    return true
  } catch (error: any) {
    const message = error.message || '表单验证失败'
    validationResult.value = { valid: false, message }
    await handleValidationError(message, 'rule-scene-form')
    return false
  }
}

const handleSubmit = async () => {
  const result = await withErrorHandling(
    async () => {
      // 验证表单
      const isValid = await handleValidate()
      if (!isValid) {
        throw new Error('表单验证失败')
      }

      // 转换数据格式
      const apiData = transformFormToApi(formData.value)

      // 这里应该调用API保存数据
      console.log('提交数据:', apiData)

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return apiData
    },
    {
      loadingKey: 'rule-scene-submit',
      loadingText: isEdit.value ? '更新中...' : '创建中...',
      context: 'rule-scene-form',
      showSuccess: true,
      successMessage: isEdit.value ? '更新成功' : '创建成功'
    }
  )

  if (result) {
    emit('success')
    handleClose()
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
.rule-scene-drawer {
  --el-drawer-padding-primary: 20px;
}

.rule-scene-form {
  height: calc(100vh - 120px);
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 80px; /* 为底部操作栏留出空间 */
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
.rule-scene-form::-webkit-scrollbar {
  width: 6px;
}

.rule-scene-form::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
  border-radius: 3px;
}

.rule-scene-form::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.rule-scene-form::-webkit-scrollbar-thumb:hover {
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
  .rule-scene-drawer {
    --el-drawer-size: 100% !important;
  }

  .rule-scene-form {
    padding: 16px;
    padding-bottom: 80px;
  }

  .form-container {
    gap: 20px;
  }

  .drawer-footer {
    padding: 12px 16px;
    gap: 12px;
  }
}
</style>
