<!--
  MES 物料产品选择器 V2：只读输入框 + 点击弹窗选择

  交互：显示为只读 el-input，点击打开弹窗（单选模式）进行选择
  Props:
    modelValue  — 绑定的物料 ID（v-model）
    itemName    — 备用显示名称（父组件已有名称时传入，可跳过 getItem 请求，避免 N+1）
    disabled    — 是否禁用
    clearable   — 是否允许清空（鼠标悬停时显示清除图标）
    placeholder — 占位文字
  Events:
    update:modelValue — v-model 更新
    change(item)      — 选中物料变化时触发，传递完整 MdItemVO（清空时为 undefined）
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
    <el-input
      ref="inputRef"
      :model-value="displayLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      :suffix-icon="suffixIcon"
      :class="disabled ? 'is-select-disabled' : 'is-select-clickable'"
    />
  </div>
  <!-- 弹窗选择器（单选模式） -->
  <MdItemSelectDialogV2 ref="dialogRef" :multiple="false" @selected="handleSelected" />
</template>

<script setup lang="ts">
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { Search, CircleClose } from '@element-plus/icons-vue'
import MdItemSelectDialogV2 from './MdItemSelectDialogV2.vue'

const attrs = useAttrs() // TODO @AI：attrs 的作用，最好也写下；

defineOptions({ name: 'MdItemSelectV2', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 绑定的物料 ID
    itemName?: string // 备用显示名称（传入后跳过 getItem 请求，适用于列表行内编辑等批量场景）
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择产品物料'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: MdItemVO | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const inputRef = ref() // 输入框 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedItem = ref<MdItemVO | undefined>() // 当前选中的物料对象
const resolving = ref(false) // 是否正在查询回显
let resolveSeq = 0 // 请求序号，防止异步竞态导致回显串值

/** 显示文本：[物料编码] 物料名称 */
const displayLabel = computed(() => {
  if (selectedItem.value) {
    return `[${selectedItem.value.code}] ${selectedItem.value.name}`
  }
  // 父组件传入了 itemName 但尚未加载到 selectedItem 时，直接显示
  if (props.itemName && props.modelValue != null) {
    return props.itemName
  }
  return ''
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标：悬停且有值时显示清除，否则显示搜索 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 ID 单条查询物料信息（用于编辑回显） */
const resolveItemById = async (id: number | undefined) => {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  // 父组件已传入 itemName 时跳过请求，避免列表批量场景的 N+1 问题
  if (props.itemName) {
    return
  }
  const seq = ++resolveSeq
  resolving.value = true
  try {
    const item = await MdItemApi.getItem(id)
    // 校验序号：丢弃过期的响应，防止快速切换时回显串值
    if (seq !== resolveSeq) return
    selectedItem.value = item
  } catch (e) {
    if (seq !== resolveSeq) return
    console.error('[MdItemSelectV2] resolveItemById failed:', e)
  } finally {
    if (seq === resolveSeq) {
      resolving.value = false
    }
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
const handleSelected = (rows: MdItemVO[]) => {
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
