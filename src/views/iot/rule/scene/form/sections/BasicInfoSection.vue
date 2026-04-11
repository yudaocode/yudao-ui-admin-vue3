<!-- 基础信息配置组件 -->
<template>
  <el-card class="border border-[var(--el-border-color-light)] rounded-8px mb-10px" shadow="never">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:info-filled" class="text-[var(--el-color-primary)] text-18px" />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]">基础信息</span>
        </div>
        <div class="flex items-center gap-8px">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { IotSceneRule } from '@/api/iot/rule/scene'

/** 基础信息配置组件 */
defineOptions({ name: 'BasicInfoSection' })

const props = defineProps<{
  modelValue: IotSceneRule
  rules?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: IotSceneRule): void
}>()

const formData = useVModel(props, 'modelValue', emit) // 表单数据
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
