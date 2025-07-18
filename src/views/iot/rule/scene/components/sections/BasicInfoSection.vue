<!-- 基础信息配置组件 -->
<template>
  <el-card class="basic-info-section" shadow="never">
    <template #header>
      <div class="section-header">
        <div class="header-left">
          <Icon icon="ep:info-filled" class="section-icon" />
          <span class="section-title">基础信息</span>
        </div>
        <div class="header-right">
          <el-tag :type="formData.status === 0 ? 'success' : 'danger'" size="small">
            {{ formData.status === 0 ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="section-content">
      <el-row :gutter="24">
        <!-- TODO @puhui999：NameInput、StatusRadio、DescriptionInput 是不是直接写在当前界面哈。有点散； -->
        <el-col :span="12">
          <el-form-item label="场景名称" prop="name" required>
            <NameInput v-model="formData.name" />
          </el-form-item>
        </el-col>
        <!-- TODO @puhui999：每个一行会好点？ -->
        <el-col :span="12">
          <el-form-item label="场景状态" prop="status" required>
            <StatusRadio v-model="formData.status" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="场景描述" prop="description">
        <DescriptionInput v-model="formData.description" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import NameInput from '../inputs/NameInput.vue'
import DescriptionInput from '../inputs/DescriptionInput.vue'
import StatusRadio from '../inputs/StatusRadio.vue'
import { RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'

/** 基础信息配置组件 */
defineOptions({ name: 'BasicInfoSection' })

interface Props {
  modelValue: RuleSceneFormData
  rules?: any
}

interface Emits {
  (e: 'update:modelValue', value: RuleSceneFormData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = useVModel(props, 'modelValue', emit)
// TODO @puhui999：看看能不能 unocss
</script>

<style scoped>
.basic-info-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-content {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
