<!--
  会员选择器：只读输入框 + 点击弹窗选择

  Props:
    modelValue  — 绑定的会员 ID（v-model）
    multiple    — 是否多选
    disabled    — 是否禁用
    clearable   — 是否允许清空
    placeholder — 占位文字
  Events:
    update:modelValue — v-model 更新
  Expose:
    reset() — 清空已选会员
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
      :model-value="displayLabel"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      :suffix-icon="suffixIcon"
    />
  </div>
  <!-- 弹窗放在输入框外，避免弹窗点击事件触发选择器 -->
  <MemberUserSelectDialog ref="dialogRef" :multiple="multiple" @selected="handleSelected" />
</template>

<script setup lang="ts">
import { CircleClose, Search } from '@element-plus/icons-vue'
import * as MemberApi from '@/api/member/user'
import MemberUserSelectDialog from './MemberUserSelectDialog.vue'

defineOptions({ name: 'MemberUserSelect', inheritAttrs: false })

const attrs = useAttrs()
const props = withDefaults(
  defineProps<{
    modelValue?: number | number[] // 绑定的会员 ID
    multiple?: boolean // 是否多选
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择会员'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedItems = ref<MemberApi.UserVO[]>([]) // 当前选中的会员
let requestId = 0

/** 当前选中的会员编号 */
const selectedIds = computed(() => {
  if (props.modelValue == null) {
    return []
  }
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

/** 输入框显示文本 */
const displayLabel = computed(() => {
  return selectedIds.value
    .map((id) => selectedItems.value.find((item) => item.id === id)?.nickname || `会员 ${id}`)
    .join('、')
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && selectedIds.value.length > 0
})

/** 后缀图标 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据编号查询会员信息（用于编辑回显） */
const resolveItemById = async (ids: number[]) => {
  const current = ++requestId
  if (ids.length === 0) {
    selectedItems.value = []
    return
  }
  // 已全部缓存时，按当前编号同步缓存，剔除已移除的会员，避免打开弹窗时仍勾选
  const cachedItems = ids
    .map((id) => selectedItems.value.find((item) => item.id === id))
    .filter((item): item is MemberApi.UserVO => !!item)
  if (cachedItems.length === ids.length) {
    selectedItems.value = cachedItems
    return
  }
  try {
    const rows = await MemberApi.getUserSelectList(ids)
    if (current === requestId) {
      selectedItems.value = rows
    }
  } catch (e) {
    console.error('[MemberUserSelect] resolveItemById failed:', e)
  }
}

/** 监听 modelValue 变化，触发回显 */
watch(selectedIds, (ids) => resolveItemById(ids), { immediate: true })

// ==================== 点击交互 ====================

/** 点击组件：清除或打开弹窗 */
const handleClick = async (e: MouseEvent) => {
  if (props.disabled) {
    return
  }
  const target = e.target as HTMLElement
  if (showClear.value && target.closest('.el-input__suffix')) {
    e.stopPropagation()
    reset()
    return
  }
  await resolveItemById(selectedIds.value)
  dialogRef.value?.open(selectedItems.value)
}

/** 接收选中的会员 */
const handleSelected = (rows: MemberApi.UserVO[]) => {
  if (rows.length === 0) {
    return
  }
  selectedItems.value = rows
  emit('update:modelValue', props.multiple ? rows.map((item) => item.id!) : rows[0].id)
}

/** 重置选择 */
const reset = () => {
  requestId++
  selectedItems.value = []
  emit('update:modelValue', props.multiple ? [] : undefined)
}
defineExpose({ reset }) // 提供 reset 方法
</script>
