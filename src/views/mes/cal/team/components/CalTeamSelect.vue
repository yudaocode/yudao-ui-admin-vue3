<!--
  MES 班组选择器：只读输入框 + 点击弹窗选择

  交互：显示为只读 el-input，点击打开弹窗（单选模式）进行选择
  Props:
    modelValue  — 绑定的班组 ID（v-model）
    disabled    — 是否禁用
    clearable   — 是否允许清空
    placeholder — 占位文字
  Events:
    update:modelValue — v-model 更新
    change(item)      — 选中班组变化时触发，传递完整 CalTeamVO（清空时为 undefined）
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
          <div>编码：{{ selectedItem.code }}</div>
          <div>名称：{{ selectedItem.name }}</div>
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
  <CalTeamSelectDialog ref="dialogRef" :multiple="false" @selected="handleSelected" />
</template>

<script setup lang="ts">
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import { Search, CircleClose } from '@element-plus/icons-vue'
import CalTeamSelectDialog from './CalTeamSelectDialog.vue'

const attrs = useAttrs()

defineOptions({ name: 'CalTeamSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 绑定的班组 ID
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择班组'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: CalTeamVO | undefined]
}>()

const dialogRef = ref()
const hovering = ref(false)

// ==================== 名称回显 ====================
const selectedItem = ref<CalTeamVO | undefined>()

/** 输入框显示文本 */
const displayLabel = computed(() => {
  return selectedItem.value?.name ?? ''
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 ID 查询班组信息（编辑回显） */
const resolveItemById = async (id: number | undefined) => {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await CalTeamApi.getTeam(id)
  } catch (e) {
    console.error('[CalTeamSelect] resolveItemById failed:', e)
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
  // 打开弹窗
  const selectedIds = props.modelValue != null ? [props.modelValue] : []
  dialogRef.value.open(selectedIds)
}

/** 弹窗选中回调 */
const handleSelected = (rows: CalTeamVO[]) => {
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
