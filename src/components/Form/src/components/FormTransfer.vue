<script lang="ts" setup>
import { computed, PropType, ref, useAttrs } from 'vue'
import { ElTransfer } from 'element-plus'
import type { TransferDirection, TransferInstance } from 'element-plus'
import type { ComponentOptionsAlias } from '@/types/components'

/**
 * Form 专用的 Transfer 适配组件
 *
 * 1. 显式传入 data（包括 []）时优先使用 data，不回退 options；纯 string / number 键时原样透传 data / props / modelValue
 * 2. 未传 data 时，根据 options + optionsAlias 生成 data，不修改调用方的 options；
 *    未配置 props.key / optionsAlias.valueField 时，逐项优先 value 字段，缺少 value 才回退 key
 * 3. 数据源（data 或 options）、model 或默认勾选项中存在 boolean 键时，对全部键做带类型前缀的可逆编码，
 *    model 与 leftDefaultChecked / rightDefaultChecked 同步编码，对外仍返回原始类型
 */
defineOptions({ name: 'FormTransfer', inheritAttrs: false })

const transferProps = defineProps({
  modelValue: {
    type: null as unknown as PropType<unknown>,
    default: undefined
  },
  data: {
    type: Array as PropType<Recordable[]>,
    default: undefined
  },
  props: {
    type: Object as PropType<Recordable>,
    default: undefined
  },
  options: {
    type: Array as PropType<Recordable[]>,
    default: undefined
  },
  optionsAlias: {
    type: Object as PropType<ComponentOptionsAlias>,
    default: undefined
  },
  // 默认勾选项需要与 model 使用相同的编码，未传时保持 undefined，交给 ElTransfer 默认值
  leftDefaultChecked: {
    type: Array as PropType<unknown[]>,
    default: undefined
  },
  rightDefaultChecked: {
    type: Array as PropType<unknown[]>,
    default: undefined
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'left-check-change', 'right-check-change'])

const attrs = useAttrs()

const transferRef = ref<TransferInstance>()

// 内部 key 字段的基础名称，与数据源已有字段冲突时自动加前缀
const INTERNAL_KEY = '__formTransferKey'

// Form 会默认附加，但 ElTransfer 不支持、会落到 DOM 上的属性
const OMIT_ATTRS = ['clearable', 'optionsSlot']

// 显式传入 data（包括 []）时走原生路径，不使用 options
const isNative = computed(() => transferProps.data !== undefined)

// 实际数据源：显式 data 优先（包括 []），否则使用 options
const sourceData = computed<Recordable[]>(() =>
  transferProps.data !== undefined ? transferProps.data : (transferProps.options ?? [])
)

// 显式 key 字段：原生路径为 props.key ?? 'key'；options 路径为 props.key ?? optionsAlias.valueField，
// 两者都未配置时返回 undefined，由 getSourceKey 逐项判断
const explicitKeyField = computed<string | undefined>(() =>
  isNative.value
    ? (transferProps.props?.key ?? 'key')
    : (transferProps.props?.key ?? transferProps.optionsAlias?.valueField)
)

// 读取单项的原始 key：显式配置的字段优先且不回退；
// 未配置时优先自身 value 字段（包括 false、0、''），缺少 value 字段才回退原生 key 字段
const getSourceKey = (item: Recordable | undefined): unknown => {
  if (!item) {
    return undefined
  }
  const field = explicitKeyField.value
  if (field !== undefined) {
    return item[field]
  }
  return Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : item.key
}
const labelField = computed(() =>
  isNative.value
    ? (transferProps.props?.label ?? 'label')
    : (transferProps.props?.label ?? transferProps.optionsAlias?.labelField ?? 'label')
)
const disabledField = computed(() => transferProps.props?.disabled ?? 'disabled')

// 非数组的绑定值（例如 ''）按 [] 展示，但不主动回写
const modelList = computed<unknown[]>(() =>
  Array.isArray(transferProps.modelValue) ? transferProps.modelValue : []
)

const hasBoolean = (list: unknown[] | undefined) =>
  !!list && list.some((value) => typeof value === 'boolean')

// 数据源、model 或默认勾选项中出现 boolean 键时才编码（原生 data 路径同样适用，异步暂无数据时也生效）
const needEncode = computed(
  () =>
    sourceData.value.some((item) => typeof getSourceKey(item) === 'boolean') ||
    hasBoolean(modelList.value) ||
    hasBoolean(transferProps.leftDefaultChecked) ||
    hasBoolean(transferProps.rightDefaultChecked)
)

const encodeKey = (key: unknown) => {
  if (!needEncode.value) {
    return key
  }
  switch (typeof key) {
    case 'boolean':
      return `b:${key}`
    case 'number':
      return `n:${key}`
    case 'string':
      return `s:${key}`
    default:
      return key
  }
}

const decodeKey = (key: unknown) => {
  if (!needEncode.value || typeof key !== 'string') {
    return key
  }
  const value = key.slice(2)
  switch (key.slice(0, 2)) {
    case 'b:':
      return value === 'true'
    case 'n:':
      return Number(value)
    case 's:':
      return value
    default:
      return key
  }
}

// 内部 key 字段，保证不覆盖数据源中的任何已有字段
const internalKey = computed(() => {
  const used = new Set<string>([labelField.value, disabledField.value])
  for (const item of sourceData.value) {
    if (item) {
      Object.keys(item).forEach((key) => used.add(key))
    }
  }
  let name = INTERNAL_KEY
  while (used.has(name)) {
    name = `_${name}`
  }
  return name
})

// 仅原生 data 且无需编码时原样透传；其余情况克隆到新对象并写入内部 key，原字段全部保留
const transferData = computed(() => {
  if (isNative.value && !needEncode.value) {
    return transferProps.data
  }
  const key = internalKey.value
  return sourceData.value.map((item) => ({
    ...item,
    [key]: encodeKey(getSourceKey(item))
  }))
})

const transferAlias = computed(() => {
  if (isNative.value && !needEncode.value) {
    return transferProps.props
  }
  return {
    ...transferProps.props,
    key: internalKey.value,
    label: labelField.value,
    disabled: disabledField.value
  }
})

// 原生 ElTransfer 只接受 string | number 作为 key
const isNativeTransferKey = (value: unknown): value is string | number =>
  typeof value === 'string' || typeof value === 'number'

// 送入原生 ElTransfer 的模型：两条路径都先按 needEncode 编码（boolean 转为前缀字符串），
// 合法 string / number key 保留，其余非法 key 仅不展示，不回写外层 model
const transferValue = computed<(string | number)[]>(() =>
  modelList.value.map(encodeKey).filter(isNativeTransferKey)
)

// 默认勾选项与 model 采用相同的编码和类型守卫；未传时保持 undefined。
// computed 只在默认勾选项或编码模式变化时生成新数组，避免重置用户手动勾选
const toTransferKeys = (list: unknown[] | undefined) =>
  list === undefined ? undefined : list.map(encodeKey).filter(isNativeTransferKey)
const transferLeftDefaultChecked = computed(() => toTransferKeys(transferProps.leftDefaultChecked))
const transferRightDefaultChecked = computed(() =>
  toTransferKeys(transferProps.rightDefaultChecked)
)

// 事件参数中的 key 数组还原为调用方类型，参数个数保持不变
const decodeArgs = (args: unknown[]) =>
  args.map((arg) => (Array.isArray(arg) ? arg.map(decodeKey) : arg))

const onUpdateModelValue = (...args: unknown[]) => emit('update:modelValue', ...decodeArgs(args))
const onChange = (...args: unknown[]) => emit('change', ...decodeArgs(args))
const onLeftCheckChange = (...args: unknown[]) => emit('left-check-change', ...decodeArgs(args))
const onRightCheckChange = (...args: unknown[]) => emit('right-check-change', ...decodeArgs(args))

const getBindAttrs = () => {
  const obj: Recordable = { ...attrs }
  OMIT_ATTRS.forEach((key) => delete obj[key])
  return obj
}

defineExpose({
  clearQuery: (which: TransferDirection) => transferRef.value?.clearQuery(which),
  leftPanel: computed(() => transferRef.value?.leftPanel),
  rightPanel: computed(() => transferRef.value?.rightPanel)
})
</script>

<template>
  <ElTransfer
    ref="transferRef"
    v-bind="getBindAttrs()"
    :data="transferData"
    :props="transferAlias"
    :model-value="transferValue"
    :left-default-checked="transferLeftDefaultChecked"
    :right-default-checked="transferRightDefaultChecked"
    @update:model-value="onUpdateModelValue"
    @change="onChange"
    @left-check-change="onLeftCheckChange"
    @right-check-change="onRightCheckChange"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}"></slot>
    </template>
  </ElTransfer>
</template>
