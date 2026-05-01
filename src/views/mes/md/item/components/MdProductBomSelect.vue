<!--
  MES 产品 BOM 子物料选择器：只读输入框 + 点击弹窗选择

  从指定产品的 BOM 子物料中选择（候选范围限定为产品已配好的 BOM 子项）。
  交互：显示为只读 el-input，点击打开弹窗（单选模式）进行选择
  Props:
    modelValue  — 绑定的 BOM 子物料 ID（v-model，对应 bomItemId）
    itemId      — 父产品 ID（决定 BOM 候选范围）
    disabled    — 是否禁用
    clearable   — 是否允许清空（鼠标悬停时显示清除图标）
    placeholder — 占位文字
  Events:
    update:modelValue — v-model 更新
    change(bom)       — 选中 BOM 变化时触发，传递完整 MdProductBomVO（清空时为 undefined）
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
    <el-tooltip :disabled="!selectedBom" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedBom" class="leading-6">
          <div>编码：{{ selectedBom.bomItemCode }}</div>
          <div>名称：{{ selectedBom.bomItemName }}</div>
          <div>规格：{{ selectedBom.bomItemSpecification || '-' }}</div>
          <div>单位：{{ selectedBom.unitMeasureName || '-' }}</div>
          <div>用量比例：{{ selectedBom.quantity }}</div>
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
  <MdProductBomSelectDialog ref="dialogRef" @selected="handleSelected" />
</template>

<script setup lang="ts">
import { MdProductBomApi, MdProductBomVO } from '@/api/mes/md/item/productBom'
import { Search, CircleClose } from '@element-plus/icons-vue'
import MdProductBomSelectDialog from './MdProductBomSelectDialog.vue'

// 组件有两个根节点（div + Dialog），Vue 不会自动继承 attrs；
// 手动透传到外层 div，确保父组件传入的 class / style 等生效
const attrs = useAttrs()

defineOptions({ name: 'MdProductBomSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 绑定的 BOM 子物料 ID（bomItemId）
    itemId?: number // 父产品 ID（决定 BOM 候选范围）
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择 BOM 物料'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [bom: MdProductBomVO | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedBom = ref<MdProductBomVO | undefined>() // 当前选中的 BOM 对象

/** 输入框显示文本 */
const displayLabel = computed(() => {
  return selectedBom.value?.bomItemName ?? ''
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标：悬停且有值时显示清除，否则显示搜索 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 bomItemId 从 BOM 列表中回显（用于编辑回显） */
const resolveBomById = async (bomItemId: number | undefined) => {
  if (bomItemId == null || props.itemId == null) {
    selectedBom.value = undefined
    return
  }
  if (selectedBom.value?.bomItemId === bomItemId) {
    return
  }
  try {
    const list = await MdProductBomApi.getProductBomListByItemId(props.itemId)
    selectedBom.value = list.find((item: MdProductBomVO) => item.bomItemId === bomItemId)
  } catch (e) {
    console.error('[MdProductBomSelect] resolveBomById failed:', e)
  }
}

/** 监听 modelValue 变化，触发回显 */
watch(
  () => props.modelValue,
  (val) => {
    resolveBomById(val)
  },
  { immediate: true }
)

/** 监听 itemId 变化，清空选中（产品变了，BOM 候选也变了） */
watch(
  () => props.itemId,
  () => {
    selectedBom.value = undefined
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
  if (props.itemId == null) {
    return
  }
  // 点击清除图标：清空选中
  const target = e.target as HTMLElement
  if (showClear.value && target.closest('.el-input__suffix')) {
    e.stopPropagation()
    selectedBom.value = undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  // 打开弹窗
  dialogRef.value.open(props.itemId, props.modelValue)
}

/** 弹窗选中回调 */
const handleSelected = (row: MdProductBomVO) => {
  selectedBom.value = row
  emit('update:modelValue', row.bomItemId)
  emit('change', row)
}
</script>

<style lang="scss" scoped>
/* :deep 用于穿透 el-input 内部元素的 cursor 样式 */
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
