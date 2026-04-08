<!--
  MES 库存选择器：只读输入框 + 点击弹窗选择

  交互：显示为只读 el-input，点击打开弹窗（单选模式）进行选择
  Props:
    modelValue     — 绑定的库存 ID（v-model）
    itemId         — 按物料 ID 过滤库存（可选，透传给弹窗）
    batchId        — 按批次 ID 过滤库存（可选，透传给弹窗）
    warehouseId    — 按仓库 ID 过滤库存（可选，透传给弹窗）
    virtualFilter  — 虚拟线边仓过滤模式：'exclude' 排除虚拟仓（默认），'only' 只看虚拟仓，'all' 不过滤
    disabled       — 是否禁用
    clearable      — 是否允许清空（鼠标悬停时显示清除图标）
    placeholder    — 占位文字
  Events:
    update:modelValue — v-model 更新
    change(item)      — 选中库存变化时触发，传递完整 WmMaterialStockVO（清空时为 undefined）
-->
<template>
  <div
    v-bind="attrs"
    class="w-full"
    :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
    @click="handleClick"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <el-tooltip :disabled="!selectedItem" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedItem" class="leading-6">
          <div>物料：{{ selectedItem.itemName || '-' }}</div>
          <div>批次：{{ selectedItem.batchCode || '-' }}</div>
          <div>数量：{{ selectedItem.quantity ?? '-' }}</div>
          <div>仓库：{{ selectedItem.warehouseName || '-' }}</div>
          <div>库区：{{ selectedItem.locationName || '-' }}</div>
          <div>库位：{{ selectedItem.areaName || '-' }}</div>
        </div>
      </template>
      <el-input
        :model-value="displayLabel"
        :placeholder="placeholder"
        :disabled="disabled"
        readonly
        :suffix-icon="suffixIcon"
        :class="disabled ? 'is-select-disabled' : 'is-select-clickable'"
      />
    </el-tooltip>
  </div>
  <!-- 弹窗必须放在 div 外部，否则弹窗内的点击事件会冒泡到 div 触发 handleClick -->
  <WmMaterialStockSelectDialog
    ref="dialogRef"
    :multiple="false"
    :item-id="itemId"
    :batch-id="batchId"
    :warehouse-id="warehouseId"
    :virtual-filter="virtualFilter"
    @selected="handleSelected"
  />
</template>

<script setup lang="ts">
import { WmMaterialStockApi, WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { Search, CircleClose } from '@element-plus/icons-vue'
import WmMaterialStockSelectDialog from './WmMaterialStockSelectDialog.vue'

// 组件有两个根节点（div + Dialog），Vue 不会自动继承 attrs；
// 手动透传到外层 div，确保父组件传入的 class / style 等生效
const attrs = useAttrs()

defineOptions({ name: 'WmMaterialStockSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 绑定的库存 ID
    itemId?: number // 按物料 ID 过滤
    batchId?: number // 按批次 ID 过滤
    warehouseId?: number // 按仓库 ID 过滤
    virtualFilter?: 'exclude' | 'only' | 'all' // 虚拟仓过滤：'exclude' 排除（默认），'only' 只看，'all' 不过滤
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    virtualFilter: 'exclude',
    disabled: false,
    clearable: true,
    placeholder: '请选择库存'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmMaterialStockVO | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedItem = ref<WmMaterialStockVO | undefined>() // 当前选中的库存对象

/** 输入框显示文本：展示 仓库 / 批次 / 数量，保持简洁 */
const displayLabel = computed(() => {
  const item = selectedItem.value
  if (!item) {
    return ''
  }
  return `${item.warehouseName || '-'} / ${item.batchCode || '-'} / 数量:${item.quantity}`
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标：悬停且有值时显示清除，否则显示搜索 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 ID 单条查询库存信息（用于编辑回显） */
const resolveItemById = async (id: number | undefined) => {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await WmMaterialStockApi.getMaterialStock(id)
  } catch (e) {
    console.error('[WmMaterialStockSelect] resolveItemById failed:', e)
  }
}

/** 监听 modelValue 变化，触发回显 */
watch(
  () => props.modelValue,
  (val) => {
    resolveItemById(val)
  },
  { immediate: true }
)

// ==================== 点击交互 ====================

/** 点击组件：清除或打开弹窗 */
const handleClick = (e: MouseEvent) => {
  if (props.disabled) {
    return
  }
  // 点击清除图标：清空选中
  const target = e.target as HTMLElement
  if (showClear.value && target.closest('.el-input__suffix')) {
    e.stopPropagation()
    selectedItem.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  // 打开弹窗，传入当前选中 ID 用于预选高亮
  const selectedIds = props.modelValue != null ? [props.modelValue] : []
  dialogRef.value.open(selectedIds)
}

/** 弹窗选中回调 */
const handleSelected = (rows: WmMaterialStockVO[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  const item = rows[0]
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}
</script>

<style lang="scss" scoped>
/* :deep 用于穿透 el-input 内部元素的 cursor 样式，UnoCSS 无法直接处理组件内部 DOM */
.is-select-clickable {
  :deep(.el-input__wrapper),
  :deep(.el-input__inner) {
    cursor: pointer;
  }
}

.is-select-disabled {
  :deep(.el-input__wrapper),
  :deep(.el-input__inner) {
    cursor: not-allowed;
  }
}
</style>
