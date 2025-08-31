<!-- 设备触发配置组件 -->
<template>
  <div class="flex flex-col gap-16px">
    <!-- 主条件配置 - 默认直接展示 -->
    <div class="space-y-16px">
      <!-- 主条件配置 -->
      <div class="flex flex-col gap-16px">
        <!-- 主条件配置 -->
        <div class="space-y-16px">
          <!-- 主条件头部 - 与附加条件组保持一致的绿色风格 -->
          <div
            class="flex items-center justify-between p-16px bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-8px"
          >
            <div class="flex items-center gap-12px">
              <div class="flex items-center gap-8px text-16px font-600 text-green-700">
                <div
                  class="w-24px h-24px bg-green-500 text-white rounded-full flex items-center justify-center text-12px font-bold"
                >
                  主
                </div>
                <span>主条件</span>
              </div>
              <el-tag size="small" type="success">必须满足</el-tag>
            </div>
          </div>

          <!-- 主条件内容配置 -->
          <MainConditionInnerConfig
            :model-value="trigger"
            @update:model-value="updateCondition"
            :trigger-type="trigger.type"
            @trigger-type-change="handleTriggerTypeChange"
          />
        </div>
      </div>
    </div>

    <!-- 条件组配置 -->
    <div class="space-y-16px">
      <!-- 条件组配置 -->
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
            <el-tag size="small" type="success">与"主条件"为且关系</el-tag>
            <el-tag size="small" type="info">
              {{ trigger.conditionGroups?.length || 0 }} 个子条件组
            </el-tag>
          </div>
          <div class="flex items-center gap-8px">
            <el-button
              type="primary"
              size="small"
              @click="addSubGroup"
              :disabled="(trigger.conditionGroups?.length || 0) >= maxSubGroups"
            >
              <Icon icon="ep:plus" />
              添加子条件组
            </el-button>
            <el-button type="danger" size="small" text @click="removeConditionGroup">
              <Icon icon="ep:delete" />
              删除条件组
            </el-button>
          </div>
        </div>

        <!-- 子条件组列表 -->
        <div
          v-if="trigger.conditionGroups && trigger.conditionGroups.length > 0"
          class="space-y-16px"
        >
          <!-- 逻辑关系说明 -->
          <div class="relative">
            <div
              v-for="(subGroup, subGroupIndex) in trigger.conditionGroups"
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
                    <el-tag size="small" type="info"> {{ subGroup?.length || 0 }}个条件 </el-tag>
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
                  :trigger-type="trigger.type"
                  :max-conditions="maxConditionsPerGroup"
                />
              </div>

              <!-- 子条件组间的"或"连接符 -->
              <div
                v-if="subGroupIndex < trigger.conditionGroups!.length - 1"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

import MainConditionInnerConfig from './MainConditionInnerConfig.vue'
import SubConditionGroupConfig from './SubConditionGroupConfig.vue'
import type { Trigger } from '@/api/iot/rule/scene'

/** 设备触发配置组件 */
defineOptions({ name: 'DeviceTriggerConfig' })

const props = defineProps<{
  modelValue: Trigger
  index: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Trigger): void
  (e: 'trigger-type-change', type: number): void
}>()

const trigger = useVModel(props, 'modelValue', emit)

const maxSubGroups = 3 // 最多 3 个子条件组
const maxConditionsPerGroup = 3 // 每组最多 3 个条件

/**
 * 更新条件
 * @param condition 条件对象
 */
const updateCondition = (condition: Trigger) => {
  trigger.value = condition
}

/**
 * 处理触发器类型变化事件
 * @param type 触发器类型
 */
const handleTriggerTypeChange = (type: number) => {
  trigger.value.type = type
  emit('trigger-type-change', type)
}

/** 添加子条件组 */
const addSubGroup = async () => {
  if (!trigger.value.conditionGroups) {
    trigger.value.conditionGroups = []
  }

  // 检查是否达到最大子组数量限制
  if (trigger.value.conditionGroups?.length >= maxSubGroups) {
    return
  }

  // 使用 nextTick 确保响应式更新完成后再添加新的子组
  await nextTick()
  if (trigger.value.conditionGroups) {
    trigger.value.conditionGroups.push([])
  }
}

/**
 * 移除子条件组
 * @param index 子条件组索引
 */
const removeSubGroup = (index: number) => {
  if (trigger.value.conditionGroups) {
    trigger.value.conditionGroups.splice(index, 1)
  }
}

/**
 * 更新子条件组
 * @param index 子条件组索引
 * @param subGroup 子条件组数据
 */
const updateSubGroup = (index: number, subGroup: any) => {
  if (trigger.value.conditionGroups) {
    trigger.value.conditionGroups[index] = subGroup
  }
}

/** 移除整个条件组 */
const removeConditionGroup = () => {
  trigger.value.conditionGroups = undefined
}
</script>
