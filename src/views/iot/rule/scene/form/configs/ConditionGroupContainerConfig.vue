<template>
  <div class="flex flex-col gap-16px">
    <!-- 条件组容器头部 -->
    <div
      class="flex items-center justify-between p-16px bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-8px"
    >
      <div class="flex items-center gap-12px">
        <div class="flex items-center gap-8px text-16px font-600 text-green-700">
          <div
            class="w-24px h-24px bg-green-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
          >
            组
          </div>
          <span>附加条件组</span>
        </div>
        <el-tag size="small" type="success">与“主条件”为且关系</el-tag>
        <el-tag size="small" type="info"> {{ modelValue?.length || 0 }} 个子条件组 </el-tag>
      </div>
      <div class="flex items-center gap-8px">
        <el-button
          type="primary"
          size="small"
          @click="addSubGroup"
          :disabled="(modelValue?.length || 0) >= maxSubGroups"
        >
          <Icon icon="ep:plus" />
          添加子条件组
        </el-button>
        <el-button type="danger" size="small" text @click="removeContainer">
          <Icon icon="ep:delete" />
          删除条件组
        </el-button>
      </div>
    </div>

    <!-- 子条件组列表 -->
    <div v-if="modelValue && modelValue.length > 0" class="space-y-16px">
      <!-- 逻辑关系说明 -->
      <div class="relative">
        <div
          v-for="(subGroup, subGroupIndex) in modelValue"
          :key="`sub-group-${subGroupIndex}`"
          class="relative"
        >
          <!-- 子条件组容器 -->
          <div
            class="border-2 border-orange-200 rounded-8px bg-orange-50 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              class="flex items-center justify-between p-16px bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-200 rounded-t-6px"
            >
              <div class="flex items-center gap-12px">
                <div class="flex items-center gap-8px text-16px font-600 text-orange-700">
                  <div
                    class="w-24px h-24px bg-orange-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
                  >
                    {{ subGroupIndex + 1 }}
                  </div>
                  <span>子条件组 {{ subGroupIndex + 1 }}</span>
                </div>
                <el-tag size="small" type="warning" class="font-500">组内条件为"且"关系</el-tag>
                <el-tag size="small" type="info">
                  {{ subGroup.conditions?.length || 0 }}个条件
                </el-tag>
              </div>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeSubGroup(subGroupIndex)"
                class="hover:bg-red-50"
              >
                <Icon icon="ep:delete" />
                删除组
              </el-button>
            </div>

            <SubConditionGroupConfig
              :model-value="subGroup"
              @update:model-value="(value) => updateSubGroup(subGroupIndex, value)"
              :trigger-type="triggerType"
              :max-conditions="maxConditionsPerGroup"
              @validate="(result) => handleSubGroupValidate(subGroupIndex, result)"
            />
          </div>

          <!-- 子条件组间的"或"连接符 -->
          <div
            v-if="subGroupIndex < modelValue!.length - 1"
            class="flex items-center justify-center py-12px"
          >
            <div class="flex items-center gap-8px">
              <!-- 连接线 -->
              <div class="w-32px h-1px bg-orange-300"></div>
              <!-- 或标签 -->
              <div class="px-16px py-6px bg-orange-100 border-2 border-orange-300 rounded-full">
                <span class="text-14px font-600 text-orange-600">或</span>
              </div>
              <!-- 连接线 -->
              <div class="w-32px h-1px bg-orange-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="p-24px border-2 border-dashed border-orange-200 rounded-8px text-center bg-orange-50"
    >
      <div class="flex flex-col items-center gap-12px">
        <Icon icon="ep:plus" class="text-32px text-orange-400" />
        <div class="text-orange-600">
          <p class="text-14px font-500 mb-4px">暂无子条件组</p>
          <p class="text-12px">点击上方"添加子条件组"按钮开始配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import SubConditionGroupConfig from './SubConditionGroupConfig.vue'

/** 条件组容器配置组件 */
defineOptions({ name: 'ConditionGroupContainerConfig' })

const props = defineProps<{
  modelValue: any
  triggerType: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'validate', result: { valid: boolean; message: string }): void
  (e: 'remove'): void
}>()

const container = useVModel(props, 'modelValue', emit)

// TODO @puhui999：这个限制去掉好了；
// 配置常量
const maxSubGroups = 3 // 最多 3 个子条件组
const maxConditionsPerGroup = 3 // 每组最多 3 个条件

// 验证状态
const subGroupValidations = ref<{ [key: number]: { valid: boolean; message: string } }>({})

// 事件处理
const addSubGroup = () => {
  if (!container.value) {
    container.value = []
  }

  // 检查是否达到最大子组数量限制
  // TODO @puhui999：最大的数量限制
  if (container.value?.length >= maxSubGroups) {
    return
  }

  // 使用 nextTick 确保响应式更新完成后再添加新的子组
  // TODO @puhui999：这里 nextTick 要不要 await
  nextTick(() => {
    if (container.value) {
      container.value.push([])
    }
  })
}

const removeSubGroup = (index: number) => {
  if (container.value) {
    container.value.splice(index, 1)
    delete subGroupValidations.value[index]

    // 重新索引验证结果
    const newValidations: { [key: number]: { valid: boolean; message: string } } = {}
    Object.keys(subGroupValidations.value).forEach((key) => {
      const numKey = parseInt(key)
      if (numKey > index) {
        newValidations[numKey - 1] = subGroupValidations.value[numKey]
      } else if (numKey < index) {
        newValidations[numKey] = subGroupValidations.value[numKey]
      }
    })
    subGroupValidations.value = newValidations

    updateValidationResult()
  }
}

const updateSubGroup = (index: number, subGroup: any) => {
  if (container.value) {
    container.value[index] = subGroup
  }
}

const removeContainer = () => {
  emit('remove')
}

const handleSubGroupValidate = (index: number, result: { valid: boolean; message: string }) => {
  subGroupValidations.value[index] = result
  updateValidationResult()
}

const updateValidationResult = () => {
  if (!container.value || container.value.length === 0) {
    emit('validate', { valid: true, message: '条件组容器为空，验证通过' })
    return
  }

  const validations = Object.values(subGroupValidations.value)
  const allValid = validations.every((v: any) => v.valid)

  if (allValid) {
    emit('validate', { valid: true, message: '条件组容器配置验证通过' })
  } else {
    const errorMessages = validations.filter((v: any) => !v.valid).map((v: any) => v.message)
    emit('validate', { valid: false, message: `子条件组配置错误: ${errorMessages.join('; ')}` })
  }
}

// 监听变化
watch(
  () => container.value,
  () => {
    updateValidationResult()
  },
  { deep: true, immediate: true }
)
</script>
