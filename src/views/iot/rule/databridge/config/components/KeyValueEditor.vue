<template>
  <div v-for="(item, index) in items" :key="index" class="flex mb-2 w-full">
    <el-input v-model="item.key" class="mr-2" placeholder="键" />
    <el-input v-model="item.value" placeholder="值" />
    <el-button class="ml-2" text type="danger" @click="removeItem(index)">
      <el-icon>
        <Delete />
      </el-icon>
      删除
    </el-button>
  </div>
  <el-button text type="primary" @click="addItem">
    <el-icon>
      <Plus />
    </el-icon>
    {{ addButtonText }}
  </el-button>
</template>

<script lang="ts" setup>
import { Delete, Plus } from '@element-plus/icons-vue'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'KeyValueEditor' })

interface KeyValueItem {
  key: string
  value: string
}

const props = defineProps<{
  modelValue: Record<string, string>
  addButtonText: string
}>()
const emit = defineEmits(['update:modelValue'])
const items = ref<KeyValueItem[]>([]) // 内部 key-value 项列表

/** 添加项目 */
const addItem = () => {
  items.value.push({ key: '', value: '' })
  updateModelValue()
}

/** 移除项目 */
const removeItem = (index: number) => {
  items.value.splice(index, 1)
  updateModelValue()
}

/** 更新 modelValue */
const updateModelValue = () => {
  const result: Record<string, string> = {}
  items.value.forEach((item) => {
    if (item.key) {
      result[item.key] = item.value
    }
  })
  emit('update:modelValue', result)
}

// TODO @puhui999：有告警的地方，尽量用 cursor 处理下
/** 监听项目变化 */
watch(items, updateModelValue, { deep: true })
watch(
  () => props.modelValue,
  (val) => {
    // 列表有值后以列表中的值为准
    if (isEmpty(val) || !isEmpty(items.value)) {
      return
    }
    items.value = Object.entries(props.modelValue).map(([key, value]) => ({ key, value }))
  }
)
</script>
