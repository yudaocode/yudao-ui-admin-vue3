<!--
  系统用户选择器 V2：只读输入框 + 点击弹窗选择

  对齐 MdVendorSelect 架构模式

  交互：显示为只读 el-input，点击打开弹窗进行选择
  Props:
    modelValue  — 绑定的用户 ID（v-model）
    defaultCurrentUser — 默认选中当前用户
    multiple    — 默认 false
    disabled    — 是否禁用
    disabledIds — 禁用的用户 ID
    clearable   — 是否允许清空（鼠标悬停时显示清除图标）
    placeholder — 占位文字
    deptId      — 部门 ID
  Events:
    update:modelValue — v-model 更新
    change(item | items)      — 选中用户变化时触发，传递完整 UserVO（清空时为 undefined | []）
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
    <el-tooltip :disabled="selectedItems.length === 0" placement="top" :show-after="500">
      <template #content>
        <div v-if="selectedItems.length > 0" class="flex gap-[10px]">
          <div v-for="selectedItem in selectedItems" :key="selectedItem.id" class="leading-6">
            <div>用户名称：{{ selectedItem.username }}</div>
            <div>用户昵称：{{ selectedItem.nickname }}</div>
            <div>部门：{{ (selectedItem as any).deptName || '-' }}</div>
            <div>手机号码：{{ selectedItem.mobile || '-' }}</div>
          </div>
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
  <!-- Dialog append-to-body 即可-->
  <UserSelectDialogV2
    ref="dialogRef"
    :multiple="multiple"
    :deptId="deptId"
    @selected="handleSelected"
  />
</template>

<script setup lang="ts">
import * as UserApi from '@/api/system/user'
import { Search, CircleClose } from '@element-plus/icons-vue'
import UserSelectDialogV2 from './UserSelectDialogV2.vue'
import { useUserStoreWithOut } from '@/store/modules/user'

// 组件有两个根节点（div + Dialog），Vue 不会自动继承 attrs；
// 手动透传到外层 div，确保父组件传入的 class / style 等生效
const attrs = useAttrs()

defineOptions({ name: 'UserSelectV2', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[] // 绑定的用户 ID
    defaultCurrentUser?: boolean // 默认选中当前用户
    multiple?: boolean // 是否多选
    disabled?: boolean // 是否禁用
    disabledIds?: number[] // 禁用的用户 ID
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文字
    deptId?: number // 部门 ID
  }>(),
  {
    defaultCurrentUser: false,
    disabled: false,
    clearable: true,
    placeholder: '请选择用户'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  change: [item: UserApi.UserVO | UserApi.UserVO[] | undefined]
}>()

const dialogRef = ref() // 弹窗 Ref
const hovering = ref(false) // 鼠标是否悬停

// ==================== 名称回显 ====================
const selectedItems = ref<UserApi.UserVO[]>([]) // 当前选中的用户

/** 输入框显示文本：展示用户昵称，保持简洁 */
const displayLabel = computed(() => {
  return selectedItems.value.map((item) => item.nickname || item.username).join('、')
})

/** 是否显示清除图标 */
const showClear = computed(() => {
  return props.clearable && !props.disabled && hovering.value && props.modelValue != null
})

/** 后缀图标：悬停且有值时显示清除，否则显示搜索 */
const suffixIcon = computed(() => {
  return showClear.value ? CircleClose : Search
})

/** 根据 ID 查询用户信息（用于编辑回显） */
const resolveItemById = async (id: number | number[] | undefined) => {
  if (id === null || id === undefined) {
    selectedItems.value = []
    return
  }
  const ids: number[] = Array.isArray(id) ? id : [id]
  if (
    selectedItems.value.length === ids.length &&
    selectedItems.value.every((item) => ids.includes(item.id))
  ) {
    return
  }
  try {
    selectedItems.value = await UserApi.getUserList(ids)
  } catch (e) {
    console.error('[UserSelectV2] resolveItemById failed:', e)
  }
}

/** 监听 modelValue 变化，触发回显 */
watch(
  () => props.modelValue,
  (val) => {
    resolveItemById(val)
  },
  { deep: true, immediate: true }
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
    selectedItems.value = []
    if (props.multiple) {
      emit('update:modelValue', [])
      emit('change', [])
    } else {
      emit('update:modelValue', undefined)
      emit('change', undefined)
    }
    return
  }
  // 打开弹窗，传入当前选中 ID 用于预选高亮
  const selectedIds = props.multiple
    ? props.modelValue || []
    : props.modelValue !== null && props.modelValue !== undefined
      ? [props.modelValue]
      : []
  dialogRef.value.open(selectedIds, props.disabledIds)
}

/** 弹窗选中回调 */
const handleSelected = (rows: UserApi.UserVO[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  selectedItems.value = rows
  if (props.multiple) {
    emit(
      'update:modelValue',
      rows.map((item) => item.id)
    )
    emit('change', rows)
  } else {
    const item = rows[0]
    emit('update:modelValue', item.id)
    emit('change', item)
  }
}

/** 检查是否有有效的预设值 */
const hasValidPresetValue = (): boolean => {
  const value = props.modelValue as any
  if (value === undefined || value === null || value === '') {
    return false
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return true
}

onMounted(() => {
  /** 默认选中当前用户 */
  if (props.defaultCurrentUser && !hasValidPresetValue()) {
    const userStore = useUserStoreWithOut()
    const user = userStore.getUser
    const currentUserId = user?.id
    if (currentUserId) {
      if (props.multiple) {
        emit('update:modelValue', [currentUserId])
      } else {
        emit('update:modelValue', currentUserId)
      }
    }
  }
})
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
