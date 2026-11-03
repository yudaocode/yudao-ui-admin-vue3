<script lang="ts" setup>
import { h, PropType } from 'vue'
import { propTypes } from '@/utils/propTypes'

import { useForm } from '@/hooks/web/useForm'
import { findIndex } from '@/utils'
import { cloneDeep, set, toPath } from 'lodash-es'
import { FormSchema, FormSetPropsType } from '@/types/form'
import type { ElForm, FormItemProp } from 'element-plus'
import type { Form as FormComponent, FormExpose } from '@/components/Form'
import type { SearchExpose, SearchProps } from '../index'

defineOptions({ name: 'Search' })

const { t } = useI18n()

const props = defineProps({
  // 生成Form的布局结构数组
  schema: {
    type: Array as PropType<FormSchema[]>,
    default: () => []
  },
  // 是否需要栅格布局
  isCol: propTypes.bool.def(false),
  // 表单label宽度
  labelWidth: propTypes.oneOfType([String, Number]).def('auto'),
  // 表单label位置，透传给 Form（ElForm）；默认 right 与原行为一致
  labelPosition: propTypes.string
    .validate((v: string) => ['left', 'right', 'top'].includes(v))
    .def('right'),
  // 操作按钮风格位置
  layout: propTypes.string.validate((v: string) => ['inline', 'bottom'].includes(v)).def('inline'),
  // 底部按钮的对齐方式
  buttomPosition: propTypes.string
    .validate((v: string) => ['left', 'center', 'right'].includes(v))
    .def('center'),
  // 底部按钮的对齐方式（与上游属性名一致）；设置时优先于 buttomPosition
  buttonPosition: propTypes.string.validate((v: string) => ['left', 'center', 'right'].includes(v)),
  showSearch: propTypes.bool.def(true),
  showReset: propTypes.bool.def(true),
  // 是否显示伸缩
  expand: propTypes.bool.def(false),
  // 是否显示伸缩（与上游属性名一致）；与 expand 任一为 true 即显示
  showExpand: propTypes.bool.def(false),
  // 伸缩的界限字段
  expandField: propTypes.string.def(''),
  inline: propTypes.bool.def(true),
  model: {
    type: Object as PropType<Recordable>,
    default: () => ({})
  },
  // 查询按钮 loading
  searchLoading: propTypes.bool.def(false),
  // 重置按钮 loading
  resetLoading: propTypes.bool.def(false),
  // 查询、重置时是否移除顶层空值（''、null、undefined、空对象）；上游默认 true，这里默认 false 保持原行为
  removeNoValueItem: propTypes.bool.def(false)
})

const emit = defineEmits(['search', 'reset', 'validate', 'register'])

// Search 为多根节点，监听不会自动透传，需显式转发 Form 的 validate 事件（保持原参数）
const onFormValidate = (prop: FormItemProp, isValid: boolean, message: string) => {
  emit('validate', prop, isValid, message)
}

// setProps 设置的临时属性，优先于组件传入的属性；原地增删属性，避免无关属性变化触发 schema 重置
const mergeProps = reactive<SearchProps>({})

const getProps = computed(() => ({ ...props, ...mergeProps }) as typeof props & SearchProps)

const visible = ref(true)

// 是否显示伸缩：兼容 expand 与 showExpand
const isExpand = computed(() => unref(getProps).expand || unref(getProps).showExpand)

// schema 来源：setProps 设置过 schema 时优先使用，否则使用组件传入的 schema
const getSchemaSource = (): FormSchema[] =>
  ('schema' in mergeProps ? mergeProps.schema : props.schema) || []

// 独立持有 schema，Form 回填的 optionApi 选项和运行时修改不会写回调用方。
const schemaRef = ref<FormSchema[]>([])

// 按字段/路径保留最近一次显式修改，避免父级 useCrudSchemas 的异步选项回填冲掉运行时配置。
// 同一路径重复设置只留最后一次；新增/删除按唯一 field 记录，不累积每次调用的历史。
const runtimeUpdates = new Map<string, FormSetPropsType & { origin: string }>()
const runtimeAdded = new Map<
  string,
  { schema: FormSchema; index?: number; before: string[]; after: string[] }
>()
const runtimeDeleted = new Set<string>()
// 内部身份独立于可通过 setSchema 改名的 field；新增项独立编号，允许改名后复用旧字段名。
let schemaOrigins = new WeakMap<object, string>()
let addedSchemaId = 0
const getOrigin = (item: FormSchema) => schemaOrigins.get(toRaw(item))!
const sourceOrigin = (field: string) => JSON.stringify(['source', field])

const rebuildSchema = () => {
  schemaOrigins = new WeakMap()
  const schema = cloneDeep(toRaw(getSchemaSource())).filter((item) => {
    const origin = sourceOrigin(item.field)
    schemaOrigins.set(item, origin)
    return !runtimeDeleted.has(origin)
  })
  for (const [origin, item] of runtimeAdded) {
    const owned = cloneDeep(item.schema)
    schemaOrigins.set(owned, origin)
    // 锚点也使用稳定身份，改名、删除前方字段都不改变新增项的相对位置。
    const before = item.before.find((id) => schema.some((v) => getOrigin(v) === id))
    const after = item.after.find((id) => schema.some((v) => getOrigin(v) === id))
    const index =
      before !== undefined
        ? schema.findIndex((v) => getOrigin(v) === before)
        : after !== undefined
          ? schema.findIndex((v) => getOrigin(v) === after) + 1
          : item.index
    if (index !== undefined) schema.splice(index, 0, owned)
    else schema.push(owned)
  }
  for (const item of runtimeUpdates.values()) {
    const target = schema.find((v) => getOrigin(v) === item.origin)
    // 从包含 value 的对象复制：lodash 顶层 cloneDeep(fn) 会变成 {}，嵌套函数才保留原引用。
    if (target) set(target, item.path, cloneDeep(item).value)
  }
  schemaRef.value = schema
}

const resetSchema = () => {
  runtimeUpdates.clear()
  runtimeAdded.clear()
  runtimeDeleted.clear()
  addedSchemaId = 0
  rebuildSchema()
}

resetSchema()

// 父级替换整个 schema 时重置运行时修改；同一来源的深层更新（如 legacy api 回填 options）
// 重新合成副本，并保留显式 add/set/delete。setProps({ schema }) 仍可主动重置同一引用。
watch(
  getSchemaSource,
  (source, previous) => {
    if (source !== previous) resetSchema()
    else rebuildSchema()
  },
  { deep: true, flush: 'sync' }
)

const newSchema = computed(() => {
  const { expandField, layout, labelPosition } = unref(getProps)
  let schema: FormSchema[] = unref(schemaRef).slice()
  if (unref(isExpand) && expandField && !unref(visible)) {
    const index = findIndex(schema, (v: FormSchema) => v.field === expandField)
    if (index > -1) {
      schema = schema.slice(0, index + 1)
    }
  }
  if (layout === 'inline') {
    schema = schema.concat([
      {
        field: 'action',
        formItemProps: {
          labelWidth: '0px',
          // label 在顶部时，按钮项补一个空白 label，与其它表单项底部对齐（参考上游 ca983590d）；
          // 模板插槽 #action-label 仍然优先。横向 label 时不渲染 label，避免增加间距
          ...(labelPosition === 'top' ? { slots: { label: () => h('span', '\u00a0') } } : {})
        }
      }
    ])
  }
  return schema
})

const { register, elFormRef, methods } = useForm({
  model: props.model || {}
})

// Form 实例：setSchema 时同时交给 Form 处理，使进行中的 optionApi 请求按手动修改失效
let formExpose: (typeof FormComponent & FormExpose) | undefined

const onFormRegister = (
  formRef: typeof FormComponent & FormExpose,
  elRef: ComponentRef<typeof ElForm>
) => {
  formExpose = formRef
  register(formRef, elRef)
}

const search = async () => {
  await unref(elFormRef)?.validate(async (isValid) => {
    if (isValid) {
      const { getFormData } = methods
      const model = await getFormData(unref(getProps).removeNoValueItem)
      emit('search', model)
    }
  })
}

const reset = async () => {
  unref(elFormRef)?.resetFields()
  const { getFormData } = methods
  const model = await getFormData(unref(getProps).removeNoValueItem)
  emit('reset', model)
}

// 设置临时属性：值为 undefined 时取消该项覆盖；含 schema 时立即按新来源重置内部 schema；含 model 时回填表单值
const setProps = (newProps: SearchProps = {}) => {
  for (const key of Object.keys(newProps) as (keyof SearchProps)[]) {
    if (newProps[key] === undefined) {
      delete mergeProps[key]
    } else {
      ;(mergeProps as Recordable)[key] = newProps[key]
    }
  }
  if ('schema' in newProps) {
    // 同一引用不会触发监听，这里显式重置
    resetSchema()
  }
  if (newProps.model) {
    methods.setValues(newProps.model)
  }
}

// 按 field + path 修改 schema（path 规则与 Form setSchema 相同，使用 lodash set）
const setSchema = (schemaProps: FormSetPropsType[]) => {
  // 按顺序处理：先保存目标及身份，再让 Form 修改；field 改名后后续同批操作仍可按新名字找到它。
  for (const item of cloneDeep(schemaProps)) {
    const target = unref(schemaRef).find((v) => v.field === item.field)
    if (!target) continue
    const origin = getOrigin(target)
    formExpose?.setSchema([item])
    set(target, item.path, item.value)
    const key = JSON.stringify([origin, toPath(item.path)])
    // 更新插入顺序，保证宽路径与嵌套路径交替修改时，回放仍按最后一次设置的顺序执行。
    runtimeUpdates.delete(key)
    runtimeUpdates.set(key, cloneDeep({ ...item, origin }))
  }
}

// 按唯一 field 新增 schema；指定 index 时插入，否则追加（操作按钮项始终在最后）。
const addSchema = (formSchema: FormSchema, index?: number) => {
  const owned = cloneDeep(formSchema)
  const origin = JSON.stringify(['added', ++addedSchemaId])
  schemaOrigins.set(owned, origin)
  const schema = unref(schemaRef)
  if (index !== undefined) schema.splice(index, 0, owned)
  else schema.push(owned)
  const position = schema.findIndex((item) => toRaw(item) === owned)
  runtimeAdded.set(origin, {
    schema: cloneDeep(owned),
    index,
    before: schema.slice(position + 1).map(getOrigin),
    after: schema.slice(0, position).reverse().map(getOrigin)
  })
}

// 不存在的 field 忽略；按稳定身份清理，改名后删除也不会在父级异步回填时复活。
const delSchema = (field: string) => {
  const schema = unref(schemaRef)
  const index = findIndex(schema, (v: FormSchema) => v.field === field)
  if (index > -1) {
    const origin = getOrigin(schema[index])
    schema.splice(index, 1)
    runtimeDeleted.add(origin)
    runtimeAdded.delete(origin)
    for (const [key, item] of runtimeUpdates) {
      if (item.origin === origin) runtimeUpdates.delete(key)
    }
  }
}

// 底部按钮的对齐方式：设置了 buttonPosition 时优先，否则沿用 buttomPosition
const buttonAlign = computed(() => unref(getProps).buttonPosition || unref(getProps).buttomPosition)

const bottonButtonStyle = computed(() => {
  return {
    textAlign: unref(buttonAlign) as unknown as 'left' | 'center' | 'right'
  }
})

const setVisible = () => {
  unref(elFormRef)?.resetFields()
  visible.value = !unref(visible)
}

const searchExpose: SearchExpose = {
  getFormData: methods.getFormData,
  getElFormExpose: methods.getElFormExpose,
  setValues: methods.setValues,
  setProps,
  setSchema,
  addSchema,
  delSchema
}

defineExpose(searchExpose)

// 供 useSearch 注册使用；Form 先于 Search 挂载，此时 Form 已注册
onMounted(() => {
  emit('register', searchExpose)
})
</script>

<template>
  <!-- update by 芋艿：class="-mb-15px" 用于降低和 ContentWrap 组件的底部距离，避免空隙过大 -->
  <Form
    :inline="getProps.inline"
    :is-col="getProps.isCol"
    :is-custom="false"
    :label-position="getProps.labelPosition"
    :label-width="getProps.labelWidth"
    :schema="newSchema"
    class="-mb-15px"
    hide-required-asterisk
    @register="onFormRegister"
    @validate="onFormValidate"
  >
    <template #action>
      <div v-if="getProps.layout === 'inline'">
        <!-- update by 芋艿：去除搜索的 type="primary"，颜色变淡一点 -->
        <el-button v-if="getProps.showSearch" :loading="getProps.searchLoading" @click="search">
          <Icon class="mr-5px" icon="ep:search" /> {{ t('common.query') }}
        </el-button>
        <!-- update by 芋艿：将 icon="ep:refresh-right" 修改成 icon="ep:refresh"，和 ruoyi-vue 搜索保持一致  -->
        <el-button v-if="getProps.showReset" :loading="getProps.resetLoading" @click="reset">
          <Icon class="mr-5px" icon="ep:refresh" /> {{ t('common.reset') }}
        </el-button>
        <el-button v-if="isExpand" text @click="setVisible">
          {{ t(visible ? 'common.shrink' : 'common.expand') }}
          <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
        </el-button>
        <!-- add by 芋艿：补充在搜索后的按钮 -->
        <slot name="actionMore"></slot>
      </div>
    </template>
    <template v-for="name in Object.keys($slots)" :key="name" #[name]>
      <slot :name="name"></slot>
    </template>
  </Form>

  <template v-if="getProps.layout === 'bottom'">
    <div :style="bottonButtonStyle">
      <el-button
        v-if="getProps.showSearch"
        :loading="getProps.searchLoading"
        type="primary"
        @click="search"
      >
        <Icon class="mr-5px" icon="ep:search" /> {{ t('common.query') }}
      </el-button>
      <el-button v-if="getProps.showReset" :loading="getProps.resetLoading" @click="reset">
        <Icon class="mr-5px" icon="ep:refresh-right" /> {{ t('common.reset') }}
      </el-button>
      <el-button v-if="isExpand" text @click="setVisible">
        {{ t(visible ? 'common.shrink' : 'common.expand') }}
        <Icon :icon="visible ? 'ep:arrow-up' : 'ep:arrow-down'" />
      </el-button>
      <!-- add by 芋艿：补充在搜索后的按钮 -->
      <slot name="actionMore"></slot>
    </div>
  </template>
</template>
