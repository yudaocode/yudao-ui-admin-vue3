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
          <!-- TODO @puhui999：dict-tag 可以哇？ -->
          <el-tag :type="formData.status === 0 ? 'success' : 'danger'" size="small">
            {{ formData.status === 0 ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="p-0">
      <el-row :gutter="24" class="mb-24px">
        <el-col :span="12">
          <el-form-item label="场景名称" prop="name" required>
            <el-input
              v-model="formData.name"
              placeholder="请输入场景名称"
              maxlength="50"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="场景状态" prop="status" required>
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="场景描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入场景描述（可选）"
          :rows="3"
          maxlength="200"
          show-word-limit
          resize="none"
        />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { RuleSceneFormData } from '@/api/iot/rule/scene/scene.types'

/** 基础信息配置组件 */
defineOptions({ name: 'BasicInfoSection' })

// TODO @puhui999：下面的 Props、Emits 可以合并到变量那；

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
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
