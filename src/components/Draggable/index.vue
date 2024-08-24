<template>
  <el-text type="info" size="small"> 拖动左上角的小圆点可对其排序 </el-text>
  <VueDraggable
    :list="formData"
    :force-fallback="true"
    :animation="200"
    handle=".drag-icon"
    class="m-t-8px"
    item-key="index"
  >
    <template #item="{ element, index }">
      <div
        class="mb-4px flex flex-col gap-4px border border-gray-2 border-rounded rounded border-solid p-8px"
      >
        <!-- 操作按钮区 -->
        <div class="m--8px m-b-4px flex flex-row items-center justify-between p-8px" style="background-color: var(--app-content-bg-color);">
          <el-tooltip content="拖动排序">
            <Icon icon="ic:round-drag-indicator" class="drag-icon cursor-move" style="color: #8a909c;" />
          </el-tooltip>
          <el-tooltip content="删除">
            <Icon
              icon="ep:delete"
              class="cursor-pointer text-red-5"
              v-if="formData.length > 1"
              @click="handleDelete(index)"
            />
          </el-tooltip>
        </div>
        <!-- 内容区 -->
        <slot :element="element" :index="index"></slot>
      </div>
    </template>
  </VueDraggable>
  <el-tooltip :disabled="limit < 1" :content="`最多添加${limit}个`">
    <el-button
      type="primary"
      plain
      class="m-t-4px w-full"
      :disabled="limit > 0 && formData.length >= limit"
      @click="handleAdd"
    >
      <Icon icon="ep:plus" /><span>添加</span>
    </el-button>
  </el-tooltip>
</template>

<script setup lang="ts">
// 拖拽组件
import VueDraggable from 'vuedraggable'
import { usePropertyForm } from '@/components/DiyEditor/util'
import { any, array } from 'vue-types'
import { propTypes } from '@/utils/propTypes'
import { cloneDeep } from 'lodash-es'

// 拖拽组件封装
defineOptions({ name: 'Draggable' })

// 定义属性
const props = defineProps({
  // 绑定值
  modelValue: array<any>().isRequired,
  // 空的元素：点击添加按钮时，创建元素并添加到列表；默认为空对象
  emptyItem: any<unknown>().def({}),
  // 数量限制：默认为0，表示不限制
  limit: propTypes.number.def(0)
})
// 定义事件
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

// 处理添加
const handleAdd = () => formData.value.push(cloneDeep(props.emptyItem || {}))
// 处理删除
const handleDelete = (index: number) => formData.value.splice(index, 1)
</script>

<style scoped lang="scss"></style>
