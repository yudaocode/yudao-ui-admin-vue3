<script setup lang="ts">
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDrawer,
  ElRadioButton,
  ElRadioGroup,
  ElText
} from 'element-plus'
import type { CheckboxValueType } from 'element-plus'
import { computed, PropType, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Icon } from '@/components/Icon'
import type { ColumnFixed, ColumnPreference, TableColumn } from '../types'
import { DEFAULT_FILTER_COLUMN, getColumnKey, normalizeColumnFixed } from '../helper'

// 列设置的一项草稿：只保存设置需要的字段，不引用、不修改调用方的列对象
interface SettingItem {
  key: string
  label: string
  hidden: boolean
  fixed: ColumnFixed
}

const modelValue = defineModel<boolean>()

const props = defineProps({
  // 当前列（Table 传入已叠加用户偏好的渲染列）
  columns: {
    type: Array as PropType<TableColumn[]>,
    default: () => []
  },
  // “还原”使用的默认列；未传或为空时，使用第一份非空 columns 的备份
  defaultColumns: {
    type: Array as PropType<TableColumn[]>,
    default: undefined
  }
})

const emit = defineEmits<{
  confirm: [preferences: ColumnPreference[]]
}>()

// 列转换为设置项：跳过 selection / expand 等特殊列；key 为空或重复时只取第一项
const toSettingItems = (columns: TableColumn[] = []): SettingItem[] => {
  const used = new Set<string>()
  const items: SettingItem[] = []
  for (const column of columns) {
    if (!column || (column.type && DEFAULT_FILTER_COLUMN.includes(column.type))) continue
    const key = getColumnKey(column)
    if (!key || used.has(key)) continue
    used.add(key)
    items.push({
      key,
      label: column.label || column.field || key,
      hidden: !!column.hidden,
      fixed: normalizeColumnFixed(column.fixed)
    })
  }
  return items
}

// 当前抽屉中的草稿（顺序 / 固定）与勾选的显示列
const draftItems = ref<SettingItem[]>([])
const checkedKeys = ref<(string | number)[]>([])

const loadDraft = (items: SettingItem[]) => {
  draftItems.value = items.map((item) => ({ ...item }))
  checkedKeys.value = items.filter((item) => !item.hidden).map((item) => item.key)
}

// 未传 defaultColumns 时的默认备份：第一份非空列建立（支持列异步到达），之后只吸收列的新增和删除
const backupItems = ref<SettingItem[]>([])

watch(
  () => props.columns,
  (columns) => {
    const items = toSettingItems(columns)
    if (!items.length) return
    // 抽屉打开时列还为空，列到达后才初始化草稿；已有草稿时不覆盖
    if (modelValue.value && !draftItems.value.length) {
      loadDraft(items)
    }
    if (!backupItems.value.length) {
      backupItems.value = items
      return
    }
    const currentKeys = new Set(items.map((item) => item.key))
    const next = backupItems.value.filter((item) => currentKeys.has(item.key))
    const known = new Set(next.map((item) => item.key))
    items.forEach((item, index) => {
      if (!known.has(item.key)) {
        next.splice(Math.min(index, next.length), 0, { ...item })
        known.add(item.key)
      }
    })
    backupItems.value = next
  },
  { immediate: true, deep: true }
)

// 每次打开都从当前列重建草稿；打开期间外部列变化不覆盖草稿，关闭或取消即丢弃
watch(
  modelValue,
  (visible) => {
    if (visible) loadDraft(toSettingItems(props.columns))
  },
  { immediate: true }
)

const checkAll = computed(
  () => draftItems.value.length > 0 && checkedKeys.value.length === draftItems.value.length
)
const isIndeterminate = computed(
  () => checkedKeys.value.length > 0 && checkedKeys.value.length < draftItems.value.length
)

const handleCheckAllChange = (value: CheckboxValueType) => {
  checkedKeys.value = value ? draftItems.value.map((item) => item.key) : []
}

const handleFixedChange = (item: SettingItem, value: unknown) => {
  item.fixed = normalizeColumnFixed(value)
}

// 还原只改草稿：按默认列的顺序、显隐和固定重建，点击“确定”后才生效
const restore = () => {
  const currentItems = toSettingItems(props.columns)
  const currentMap = new Map(currentItems.map((item) => [item.key, item]))
  const defaultItems = props.defaultColumns?.length
    ? toSettingItems(props.defaultColumns)
    : backupItems.value
  const used = new Set<string>()
  const items: SettingItem[] = []
  for (const item of defaultItems) {
    const current = currentMap.get(item.key)
    // 默认列中已被删除的列不再出现
    if (!current || used.has(item.key)) continue
    used.add(item.key)
    items.push({ ...item, label: current.label })
  }
  // 默认列之外新增的列，按当前定义追加在末尾
  for (const item of currentItems) {
    if (!used.has(item.key)) {
      used.add(item.key)
      items.push({ ...item })
    }
  }
  loadDraft(items)
}

// 只发出偏好（按草稿顺序），不发出列对象
const confirm = () => {
  const checked = new Set(checkedKeys.value)
  emit(
    'confirm',
    draftItems.value.map((item) => ({
      key: item.key,
      hidden: !checked.has(item.key),
      fixed: item.fixed
    }))
  )
  modelValue.value = false
}

const cancel = () => {
  modelValue.value = false
}
</script>

<template>
  <ElDrawer v-model="modelValue" title="列设置" size="350px">
    <div>
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-between">
          <ElCheckbox
            :model-value="checkAll"
            :indeterminate="isIndeterminate"
            title="全选"
            aria-label="全选"
            @change="handleCheckAllChange"
          />
          <ElText class="ml-8px!">{{ checkedKeys.length }} / {{ draftItems.length }}</ElText>
        </div>
        <ElText>固定 / 排序</ElText>
      </div>
      <div v-if="draftItems.length">
        <VueDraggable
          v-model="draftItems"
          target=".el-checkbox-group"
          handle=".handle"
          :animation="150"
        >
          <ElCheckboxGroup v-model="checkedKeys">
            <div
              v-for="item in draftItems"
              :key="item.key"
              class="flex items-center justify-between mt-12px"
            >
              <ElCheckbox :value="item.key">
                {{ item.label }}
              </ElCheckbox>
              <div class="flex items-center">
                <ElRadioGroup
                  size="small"
                  :model-value="item.fixed"
                  :aria-label="`${item.label} 固定方式`"
                  @update:model-value="(value) => handleFixedChange(item, value)"
                >
                  <ElRadioButton value="left" title="固定在左侧" aria-label="固定在左侧">
                    <Icon icon="ep:arrow-left" />
                  </ElRadioButton>
                  <ElRadioButton :value="false" title="不固定" aria-label="不固定">
                    <Icon icon="ep:close" />
                  </ElRadioButton>
                  <ElRadioButton value="right" title="固定在右侧" aria-label="固定在右侧">
                    <Icon icon="ep:arrow-right" />
                  </ElRadioButton>
                </ElRadioGroup>

                <div
                  class="ml-12px cursor-move handle"
                  :title="`拖动排序：${item.label}`"
                  :aria-label="`拖动排序：${item.label}`"
                >
                  <Icon icon="ep:rank" />
                </div>
              </div>
            </div>
          </ElCheckboxGroup>
        </VueDraggable>
      </div>
    </div>
    <template #footer>
      <div>
        <ElButton @click="cancel">取消</ElButton>
        <ElButton @click="restore">还原</ElButton>
        <ElButton type="primary" @click="confirm">确定</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>
