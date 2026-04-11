<!-- 定时触发器条件组配置组件 -->
<template>
  <div class="space-y-16px">
    <!-- 条件组容器头部 -->
    <div
      class="flex items-center justify-between p-16px bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-8px"
    >
      <div class="flex items-center gap-12px">
        <div class="flex items-center gap-8px text-16px font-600 text-blue-700">
          <div
            class="w-24px h-24px bg-blue-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
          >
            组
          </div>
          <span>附加条件组</span>
        </div>
        <el-tag size="small" type="info">定时触发时需满足以下条件</el-tag>
        <el-tag size="small" type="warning"> {{ conditionGroups?.length || 0 }} 个子条件组 </el-tag>
      </div>
      <el-button
        type="primary"
        size="small"
        @click="addConditionGroup"
        :disabled="(conditionGroups?.length || 0) >= maxGroups"
      >
        <Icon icon="ep:plus" />
        添加条件组
      </el-button>
    </div>

    <!-- 条件组列表 -->
    <div v-if="conditionGroups && conditionGroups.length > 0" class="space-y-16px">
      <div
        v-for="(group, groupIndex) in conditionGroups"
        :key="`group-${groupIndex}`"
        class="relative"
      >
        <!-- 条件组容器 -->
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
                  {{ groupIndex + 1 }}
                </div>
                <span>子条件组 {{ groupIndex + 1 }}</span>
              </div>
              <el-tag size="small" type="warning" class="font-500">组内条件为"且"关系</el-tag>
              <el-tag size="small" type="info"> {{ group?.length || 0 }}个条件 </el-tag>
            </div>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeConditionGroup(groupIndex)"
              class="hover:bg-red-50"
            >
              <Icon icon="ep:delete" />
              删除组
            </el-button>
          </div>

          <SubConditionGroupConfig
            :model-value="group"
            @update:model-value="(value) => updateConditionGroup(groupIndex, value)"
            :trigger-type="IotRuleSceneTriggerTypeEnum.TIMER"
            :max-conditions="maxConditionsPerGroup"
          />
        </div>

        <!-- 条件组间的"或"连接符 -->
        <div
          v-if="groupIndex < conditionGroups.length - 1"
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

    <!-- 空状态 -->
    <div
      v-else
      class="p-24px border-2 border-dashed border-blue-200 rounded-8px text-center bg-blue-50"
    >
      <div class="flex flex-col items-center gap-12px">
        <Icon icon="ep:plus" class="text-32px text-blue-400" />
        <div class="text-blue-600">
          <p class="text-14px font-500 mb-4px">暂无附加条件</p>
          <p class="text-12px">定时触发时将直接执行动作</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import SubConditionGroupConfig from './SubConditionGroupConfig.vue'
import type { TriggerCondition } from '@/api/iot/rule/scene'
import { IotRuleSceneTriggerTypeEnum } from '@/views/iot/utils/constants'

/** 定时触发器条件组配置组件 */
defineOptions({ name: 'TimerConditionGroupConfig' })

const props = defineProps<{
  modelValue?: TriggerCondition[][]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TriggerCondition[][]): void
}>()

const conditionGroups = useVModel(props, 'modelValue', emit)

const maxGroups = 3 // 最多 3 个条件组
const maxConditionsPerGroup = 3 // 每组最多 3 个条件

/** 添加条件组 */
const addConditionGroup = async () => {
  if (!conditionGroups.value) {
    conditionGroups.value = []
  }
  // 检查是否达到最大条件组数量限制
  if (conditionGroups.value.length >= maxGroups) {
    return
  }
  // 使用 nextTick 确保响应式更新完成后再添加新的条件组
  await nextTick()
  if (conditionGroups.value) {
    conditionGroups.value.push([])
  }
}

/** 移除条件组 */
const removeConditionGroup = (index: number) => {
  if (conditionGroups.value) {
    conditionGroups.value.splice(index, 1)
  }
}

/** 更新条件组 */
const updateConditionGroup = (index: number, group: TriggerCondition[]) => {
  if (conditionGroups.value) {
    conditionGroups.value[index] = group
  }
}
</script>
