<!--
  MES 发货通知单行选择器：只读输入框 + 点击弹窗选择

  交互：显示为只读 el-input，点击打开弹窗（单选模式）进行选择
  Props:
    modelValue  — 绑定的发货通知单行 ID（v-model）
    noticeId    — 发货通知单 ID（透传给 Dialog，限制可选范围）
    disabled    — 是否禁用
    clearable   — 是否允许清空（鼠标悬停时显示清除图标）
    placeholder — 占位文字
  Events:
    update:modelValue — v-model 更新
    change(item)      — 选中行变化时触发，传递完整 WmSalesNoticeLineVO（清空时为 undefined）
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
          <div>物料编码：{{ selectedItem.itemCode }}</div>
          <div>物料名称：{{ selectedItem.itemName }}</div>
          <div>规格型号：{{ selectedItem.specification || '-' }}</div>
          <div>发货数量：{{ selectedItem.quantity }}</div>
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
  <WmSalesNoticeLineSelectDialog
    ref="dialogRef"
    :multiple="false"
    :notice-id="noticeId"
    @selected="handleSelected"
  />
</template>

<script setup lang="ts">
import { WmSalesNoticeLineApi, WmSalesNoticeLineVO } from '@/api/mes/wm/salesnotice/line'
import { Search, CircleClose } from '@element-plus/icons-vue'
import WmSalesNoticeLineSelectDialog from './WmSalesNoticeLineSelectDialog.vue'

// 组件有两个根节点（div + Dialog），Vue 不会自动继承 attrs；
// 手动透传到外层 div，确保父组件传入的 class / style 等生效
const attrs = useAttrs()

defineOptions({ name: 'WmSalesNoticeLineSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 绑定的发货通知单行 ID
    noticeId?: number // 发货通知单 ID
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择发货通知单行'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: WmSalesNoticeLineVO | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedItem = ref<WmSalesNoticeLineVO | undefined>() // 当前选中的行对象

/** 输入框显示文本：展示 "物料编码 - 物料名称"，保持简洁易读 */
const displayLabel = computed(() => {
  if (!selectedItem.value) {
    return ''
  }
  return `${selectedItem.value.itemCode} - ${selectedItem.value.itemName}`
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标：悬停且有值时显示清除，否则显示搜索 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 ID 单条查询行信息（用于编辑回显） */
const resolveItemById = async (id: number | undefined) => {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await WmSalesNoticeLineApi.getSalesNoticeLine(id)
  } catch (e) {
    console.error('[WmSalesNoticeLineSelect] resolveItemById failed:', e)
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

/** 监听 noticeId 变化：清空当前选中（关联的行已失效） */
watch(
  () => props.noticeId,
  () => {
    selectedItem.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
  }
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
const handleSelected = (rows: WmSalesNoticeLineVO[]) => {
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
