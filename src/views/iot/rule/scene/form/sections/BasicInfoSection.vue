<!-- 基础信息配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:info-filled" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">基础信息</span>
        </div>
        <div class="flex items-center gap-8px">
          <el-tag :type="formData.status === 0 ? 'success' : 'danger'" size="small">
            {{ formData.status === 0 ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="p-0">
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
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
