<script lang="tsx">
import {
  cloneVNode,
  computed,
  createTextVNode,
  createVNode,
  defineComponent,
  Fragment,
  isVNode,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
  toRaw,
  unref,
  watch
} from 'vue'
import type { VNode } from 'vue'
import { ElCol, ElForm, ElFormItem, ElRow, ElTooltip } from 'element-plus'
import { componentMap } from './componentMap'
import { propTypes } from '@/utils/propTypes'
import { getSlot } from '@/utils/tsxHelper'
import {
  getModelValue,
  hasModelValue,
  initModel,
  setComponentProps,
  setFormItemSlots,
  setGridProp,
  setItemComponentSlots,
  setModelValue,
  setTextPlaceholder,
  unsetModelValue
} from './helper'
import { useRenderSelect } from './components/useRenderSelect'
import { useRenderRadio } from './components/useRenderRadio'
import { useRenderCheckbox } from './components/useRenderCheckbox'
import { useDesign } from '@/hooks/web/useDesign'
import { findIndex } from '@/utils'
import { isFunction } from '@/utils/is'
import { cloneDeep, cloneDeepWith, isObject, isPlainObject, set, toPath } from 'lodash-es'
import { FormProps } from './types'
import { Icon } from '@/components/Icon'
import { FormSchema, FormSetPropsType } from '@/types/form'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('form')

type OptionApi = NonNullable<FormSchema['optionApi']>

// inline 表单中输入类组件默认宽度（参考上游 ab98ceb85），插槽、Radio/Checkbox 等不追加
const inlineInputComponents = [
  'Input',
  'Autocomplete',
  'InputNumber',
  'InputPassword',
  'Select',
  'SelectV2',
  'Cascader',
  'TreeSelect',
  'DatePicker',
  'TimePicker',
  'TimeSelect'
]

// 自动渲染 options 的组件：componentProps.slots.default 为函数时由它替换 options 渲染
const optionSlotComponents = [
  'Select',
  'Radio',
  'RadioGroup',
  'RadioButton',
  'Checkbox',
  'CheckboxGroup',
  'CheckboxButton'
]

// 是否显式设置了宽度，有则保持调用方宽度，不追加默认宽度
const hasExplicitWidth = (style: unknown): boolean => {
  if (!style) return false
  if (Array.isArray(style)) return style.some(hasExplicitWidth)
  if (typeof style === 'string') return /(^|;)\s*(min-|max-)?width\s*:/i.test(style)
  return ['width', 'minWidth', 'maxWidth', 'min-width', 'max-width'].some(
    (key) => (style as Recordable)[key] !== undefined && (style as Recordable)[key] !== ''
  )
}

// 是否需要默认宽度：范围日期/时间选择器自身更宽，保持原宽度
const needInlineInputWidth = (item: FormSchema): boolean => {
  const componentProps: Recordable = item.componentProps || {}
  if (!inlineInputComponents.includes(item.component as string)) return false
  if (hasExplicitWidth(componentProps.style)) return false
  if (item.component === 'DatePicker' && /range$/i.test(componentProps.type || '')) return false
  if (item.component === 'TimePicker' && (componentProps.isRange || componentProps['is-range'])) {
    return false
  }
  return true
}

export default defineComponent({
  name: 'Form',
  props: {
    // 生成Form的布局结构数组
    schema: {
      type: Array as PropType<FormSchema[]>,
      default: () => []
    },
    // 是否需要栅格布局
    // update by 芋艿：将 true 改成 false，因为项目更常用这种方式
    isCol: propTypes.bool.def(false),
    // 表单数据对象
    model: {
      type: Object as PropType<Recordable>,
      default: () => ({})
    },
    // 是否自动设置placeholder
    autoSetPlaceholder: propTypes.bool.def(true),
    // 是否自定义内容
    isCustom: propTypes.bool.def(false),
    // 表单label宽度
    labelWidth: propTypes.oneOfType([String, Number]).def('auto'),
    // 是否 loading 数据中 add by 芋艿
    vLoading: propTypes.bool.def(false),
    // schema 移除字段（delSchema、替换 schema 等）后是否同时删除其值（参考上游 08665a35a），默认保留。
    // 只删除开启后从 schema 中移除的字段；setValues / model 传入的非 schema 字段（如 id）不受影响
    pruneRemovedFields: propTypes.bool.def(false)
  },
  emits: ['register'],
  setup(props, { slots, expose, emit, attrs }) {
    // element form 实例
    const elFormRef = ref<ComponentRef<typeof ElForm>>()

    const mergeProps = ref<FormProps>({})

    const getProps = computed(() => {
      const propsObj = { ...props }
      Object.assign(propsObj, unref(mergeProps))
      return propsObj
    })

    // 与 ElForm 最终收到的 inline 一致：inline 未在本组件声明，调用方传入时经 $attrs 透传到根节点 ElForm，
    // 覆盖 getFormBindValue 中 setProps 设置的值；ElForm 的 inline 为布尔属性，'' 转为 true，其余按真值生效
    const isFormInline = () => {
      const inline = Object.prototype.hasOwnProperty.call(attrs, 'inline')
        ? attrs.inline
        : (unref(getProps) as FormProps).inline
      return inline === '' || !!inline
    }

    // 表单数据
    const formModel = ref<Recordable>(cloneDeep(props.model))

    // remove 的字段：不渲染，值也不出现在表单数据中
    const removedFields = computed(() =>
      (unref(getProps).schema || []).filter((v) => v.remove).map((v) => v.field)
    )

    // 删除 remove 字段的值（支持嵌套路径，不存在时不改动）
    const omitRemovedValues = (model: Recordable) => {
      for (const field of unref(removedFields)) {
        unsetModelValue(model, field)
      }
    }

    // setValues、ElForm resetFields（会按已卸载表单项缓存的初始值回写）或插槽等写回 remove 字段时，同步删除，
    // 保证对外的表单数据（formModel / getFormData）始终不含已移除的值。
    // 先读取值再判断是否存在：lodash has 使用 hasOwnProperty.call，不经过响应式代理收集依赖
    watch(
      () => {
        const model = unref(formModel)
        return unref(removedFields).filter((field) => {
          getModelValue(model, field)
          return hasModelValue(model, field)
        })
      },
      (fields) => {
        if (fields.length) omitRemovedValues(unref(formModel))
      },
      { flush: 'sync' }
    )

    onMounted(() => {
      emit('register', unref(elFormRef)?.$parent, unref(elFormRef))
    })

    // 对表单赋值
    const setValues = (data: Recordable = {}) => {
      // 隔离传入数据：深拷贝普通对象/数组，避免嵌套路径编辑或 resetFields 写回调用方对象；
      // File、Date、函数、类实例等其他类型保持原引用。仍按 Object.assign 局部合并
      const values = cloneDeepWith(data, (value) =>
        isObject(value) && !isPlainObject(value) && !Array.isArray(value) ? value : undefined
      )
      formModel.value = Object.assign(unref(formModel), values)
      // remove 字段不接受赋值
      omitRemovedValues(unref(formModel))
    }

    const setProps = (props: FormProps = {}) => {
      mergeProps.value = Object.assign(unref(mergeProps), props)
    }

    const delSchema = (field: string) => {
      const { schema } = unref(getProps)

      const index = findIndex(schema, (v: FormSchema) => v.field === field)
      if (index > -1) {
        schema.splice(index, 1)
      }
    }

    const addSchema = (formSchema: FormSchema, index?: number) => {
      const { schema } = unref(getProps)
      if (index !== void 0) {
        schema.splice(index, 0, formSchema)
        return
      }
      schema.push(formSchema)
    }

    // 手动修改选项时让进行中的远程请求失效、设置 remove 时结束当前请求代次；由下方 optionApi 管理器在 setup 内初始化
    let invalidateOptionApi = (_field: string, _path: string, _value: unknown) => {}

    const setSchema = (schemaProps: FormSetPropsType[]) => {
      const { schema } = unref(getProps)
      for (const v of schema) {
        for (const item of schemaProps) {
          if (v.field === item.field) {
            invalidateOptionApi(v.field, item.path, item.value)
            set(v, item.path, item.value)
          }
        }
      }
    }

    const getElFormRef = (): ComponentRef<typeof ElForm> => {
      return unref(elFormRef) as ComponentRef<typeof ElForm>
    }

    // 按 field 存储表单组件、form-item 实例；使用 Map 避免任意 field 名与原型属性冲突，且不触发渲染
    const formComponents = new Map<string, any>()
    const formItemComponents = new Map<string, ComponentRef<typeof ElFormItem>>()

    // 各 field 最近一次渲染的 vnode，用于判断下一次渲染是复用原实例还是新挂载
    const lastComponentVNodes = new Map<string, VNode>()
    const lastFormItemVNodes = new Map<string, VNode>()
    // 上一次渲染是否为栅格布局；切换时表单项整体重新挂载
    let lastIsCol: boolean | undefined
    const lastColKeys = new Map<string, unknown>()

    // 与 Vue 赋给模板 ref 的值一致：有 expose 时为 exposeProxy，否则为组件 proxy（函数式组件为元素）
    const getPublicInstance = (vnode: VNode): any => {
      const instance = vnode.component
      if (!instance) return undefined
      // 异步包装器与内层共享 vnode 钩子；始终记录 Vue ref 实际指向的内层公开实例
      if ((vnode.type as { __asyncLoader?: unknown }).__asyncLoader) {
        return getPublicInstance(instance.subTree)
      }
      if (instance.exposed) return instance.exposeProxy || undefined
      return instance.proxy || vnode.el || undefined
    }

    // 实例仍存活、类型与 key 相同，则本次渲染会复用该实例
    const canReuse = (last: VNode | undefined, next: VNode) => {
      return (
        !!last?.component &&
        !last.component.isUnmounted &&
        last.type === next.type &&
        last.key === next.key
      )
    }

    // 仅用于让 Vue 生成对外实例（exposeProxy）的空回调 ref
    const materializeRef = () => {}

    // 通过 vnode 生命周期钩子按 field 记录实例，不改动调用方经 componentProps/formItemProps 传入的 ref；
    // 只有没有调用方 ref、且将新挂载（或复用的实例尚未生成对外实例）时，才追加空回调 ref。
    // 复用实例时 vnode 不带内部 ref，调用方移除 ref 后由 Vue 按原逻辑清空旧 ref
    const trackInstance = (
      vnode: VNode,
      map: Map<string, any>,
      lastVNodes: Map<string, VNode>,
      field: string,
      structureStable = true,
      childVNodes?: Map<string, VNode>
    ) => {
      const last = lastVNodes.get(field)
      // 将被复用的实例；结构变化或不可复用时为新挂载
      const materialized = structureStable && canReuse(last, vnode) && !!getPublicInstance(last!)
      const record = (current: VNode) => {
        const instance = getPublicInstance(current)
        if (instance) map.set(field, instance)
      }
      const extraProps: Recordable = {
        onVnodeMounted: record,
        onVnodeUpdated: record,
        onVnodeBeforeUnmount: (current: VNode) => {
          const instance = getPublicInstance(current)
          if (instance && map.get(field) === instance) map.delete(field)
          if (lastVNodes.get(field) === current) lastVNodes.delete(field)
          // form-item 卸载时，一并清理其内部组件的记录（组件实例可能已被同 key 插槽内容复用）
          const child = childVNodes?.get(field)
          if (child?.component?.parent === current.component) childVNodes?.delete(field)
        }
      }
      if (vnode.ref == null && !materialized) {
        extraProps.ref = materializeRef
      }
      const tracked = cloneVNode(vnode, extraProps)
      lastVNodes.set(field, tracked)
      return tracked
    }

    // 获取表单组件实例；使用插槽自定义渲染的字段没有组件实例，返回 undefined
    const getComponentExpose = (field: string) => {
      return formComponents.get(field)
    }

    // 获取 form-item 实例
    const getFormItemExpose = (field: string) => {
      return formItemComponents.get(field)
    }

    expose({
      setValues,
      formModel,
      setProps,
      delSchema,
      addSchema,
      setSchema,
      getElFormRef,
      getComponentExpose,
      getFormItemExpose
    })

    // 上一次 schema 的 field 快照：schema 原地增删时 deep watch 的新旧值是同一数组，不能用旧值比较
    let prevSchemaFields: string[] = []

    // pruneRemovedFields：删除上一次 schema 有、本次没有的 field 的值（支持嵌套路径）。
    // 与本次仍存在的 field 相同或互为祖先/后代路径时保守跳过，避免误删仍在使用的值
    const pruneRemovedFieldValues = (model: Recordable, fields: string[]) => {
      const current = new Set(fields)
      const currentPaths = fields.map((field) => toPath(field))
      for (const field of prevSchemaFields) {
        if (current.has(field)) continue
        const path = toPath(field)
        const related = currentPaths.some((other) => {
          const length = Math.min(path.length, other.length)
          return path.slice(0, length).every((key, index) => key === other[index])
        })
        if (!related) unsetModelValue(model, field)
      }
    }

    // 监听表单结构化数组，重新生成formModel
    watch(
      () => unref(getProps).schema,
      (schema = []) => {
        const model = initModel(schema, unref(formModel))
        const fields = schema.map((v) => v.field)
        if (unref(getProps).pruneRemovedFields) pruneRemovedFieldValues(model, fields)
        prevSchemaFields = fields
        formModel.value = model
      },
      {
        immediate: true,
        deep: true
      }
    )

    // optionApi：按 field + 当前接口函数记录一次请求（参考上游 49451ae60、9b134161a）。
    // 不在 render 中请求；返回空数组、非数组或异常均视为已结束，不重复请求；
    // 接口函数变更、字段删除/remove、组件卸载后，旧请求的结果不再写入。hidden 字段仍挂载，请求与结果照常保留
    type OptionRequest = { api: OptionApi; options?: any[]; invalidated: boolean }
    const optionApiRequests = new Map<string, OptionRequest>()
    // schema 也允许普通数组/computed 产出的非响应式对象，异步写入后显式触发表单渲染
    const optionRenderVersion = ref(0)
    let isUnmounted = false

    // TreeSelect / Transfer 的选项写入 componentProps.data，其余写入 componentProps.options
    const getOptionPath = (item: FormSchema) => {
      return ['TreeSelect', 'Transfer'].includes(item.component as string)
        ? 'componentProps.data'
        : 'componentProps.options'
    }

    // 已有非空 options / data（如芋道字典静态选项、调用方手动填入）时不使用 optionApi
    const hasOptions = (item?: FormSchema) => {
      const { options, data } = (item?.componentProps || {}) as Recordable
      return [options, data].some((list) => Array.isArray(list) && list.length > 0)
    }

    invalidateOptionApi = (field, path, value) => {
      // 与 set 使用同样的路径分段规则：支持 options[0]，同时避免误匹配 optionsAlias / data-*
      const [root, key] = toPath(path)
      // remove：立即结束当前代次，晚到结果不再写入；恢复后按新一轮请求
      if (root === 'remove' && key === undefined && value) {
        optionApiRequests.delete(field)
        return
      }
      if (root === 'componentProps' && (key === undefined || key === 'options' || key === 'data')) {
        const request = optionApiRequests.get(field)
        if (request) request.invalidated = true
      }
    }

    const applyOptions = (item: FormSchema, request: OptionRequest) => {
      if (!request.options?.length || request.invalidated) return
      // API 写入走内部路径，避免被识别为调用方的手动选项更新
      set(item, getOptionPath(item), request.options)
      optionRenderVersion.value++
    }

    const checkManualOptions = (item: FormSchema, request: OptionRequest) => {
      if (!hasOptions(item)) return
      const { options, data } = (item.componentProps || {}) as Recordable
      if (
        [options, data].some(
          (value) => Array.isArray(value) && value.length > 0 && toRaw(value) !== request.options
        )
      ) {
        request.invalidated = true
      }
    }

    const loadOptions = (schema: FormSchema[]) => {
      const fields = new Set<string>()
      for (const item of schema) {
        const api = item.optionApi
        if (item.remove || typeof api !== 'function') continue
        fields.add(item.field)
        // 同一字段、同一接口函数只请求一次（包括进行中、已结束）
        const previous = optionApiRequests.get(item.field)
        if (previous?.api === api) {
          checkManualOptions(item, previous)
          // Search/computed 可能重新创建 schema；复用当前代次已获得的结果，不重复请求
          if (!hasOptions(item)) applyOptions(item, previous)
          continue
        }
        const request: OptionRequest = { api, invalidated: hasOptions(item) }
        optionApiRequests.set(item.field, request)
        if (request.invalidated) continue
        const field = item.field
        const isCurrent = () =>
          !isUnmounted && optionApiRequests.get(field) === request && !request.invalidated
        Promise.resolve()
          .then(() => api())
          .then((options: unknown) => {
            if (!isCurrent() || !Array.isArray(options) || options.length === 0) return
            const current = unref(getProps).schema.find((v) => v.field === field)
            // 请求期间调用方已填入非空选项时，不用接口结果覆盖；已 remove 的字段不回填
            if (!current || current.remove) return
            checkManualOptions(current, request)
            if (request.invalidated) return
            request.options = toRaw(options)
            applyOptions(current, request)
          })
          .catch((error) => {
            if (isCurrent()) console.warn(`[Form] optionApi of field "${field}" failed`, error)
          })
      }
      // 字段删除或 remove：作废旧请求，重新出现时按新一轮请求
      for (const field of optionApiRequests.keys()) {
        if (!fields.has(field)) optionApiRequests.delete(field)
      }
    }

    // 同时观察外部选项更新；内部写入的数组由当前请求持有，不会被误判为手动更新或重复请求
    watch(
      () =>
        (unref(getProps).schema || []).map((v) => {
          const { options, data } = (v.componentProps || {}) as Recordable
          return [v.field, v.optionApi, v.remove, options, options?.length, data, data?.length]
        }),
      () => loadOptions(unref(getProps).schema || []),
      { immediate: true }
    )

    onBeforeUnmount(() => {
      isUnmounted = true
      optionApiRequests.clear()
    })

    // 渲染包裹标签，是否使用栅格布局
    const renderWrap = () => {
      const { isCol } = unref(getProps)
      const content = isCol ? (
        <ElRow gutter={20}>{renderFormItemWrap()}</ElRow>
      ) : (
        renderFormItemWrap()
      )
      return content
    }

    // 渲染 Divider：与其它组件一样支持 componentProps.on 与 slots（函数为渲染函数，标记对应模板插槽 #字段-插槽名）；
    // 默认内容为 label，只有函数 default 或确实存在的模板默认插槽才替换
    const renderDivider = (item: FormSchema) => {
      const Com = componentMap['Divider'] as ReturnType<typeof defineComponent>
      const dividerSlots: Recordable = {
        ...setItemComponentSlots(slots, item?.componentProps?.slots, item.field)
      }
      const defaultSlot = item?.componentProps?.slots?.default
      if (!isFunction(defaultSlot) && !(defaultSlot && slots[`${item.field}-default`])) {
        dividerSlots.default = () => [item?.label]
      }
      return (
        <Com
          key={item.field}
          v-show={!item.hidden}
          {...{ contentPosition: 'left', ...setComponentProps(item) }}
        >
          {{ ...dividerSlots }}
        </Com>
      )
    }

    // 是否要渲染el-col
    const renderFormItemWrap = () => {
      unref(optionRenderVersion)
      // remove 属性表示移除，不做渲染；hidden 只隐藏（v-show），表单项保持挂载（参考上游 0f531fd1d、9a5c7bcb5 的意图）
      const { schema = [], isCol } = unref(getProps)
      // 栅格布局切换时，表单项会整体重新挂载
      const structureStable = lastIsCol === isCol
      lastIsCol = isCol
      const fields = new Set(schema.filter((item) => !item.remove).map((item) => item.field))
      for (const field of lastColKeys.keys()) {
        if (!fields.has(field)) lastColKeys.delete(field)
      }

      // 各表单项根节点以 field 作为 key：移除、删除、调整顺序时按字段移动/卸载节点，
      // 避免按位置复用到其他字段，导致实例（校验、重置、按 field 获取的实例）错位
      return schema
        .filter((v) => !v.remove)
        .map((item) => {
          // 如果是 Divider 组件，需要自己占用一行
          const isDivider = item.component === 'Divider'
          const colProps = setGridProp(item.colProps)
          const colKey = Object.prototype.hasOwnProperty.call(colProps, 'key')
            ? (colProps as Recordable).key
            : item.field
          const itemStructureStable =
            structureStable && (!isCol || lastColKeys.get(item.field) === colKey)
          lastColKeys.set(item.field, colKey)
          // hidden 时 Divider、栅格 ElCol 外层一并隐藏，不留占位空白（参考上游 0f531fd1d 的意图）
          return isDivider ? (
            renderDivider(item)
          ) : isCol ? (
            // 如果需要栅格，需要包裹 ElCol
            <ElCol key={item.field} v-show={!item.hidden} {...colProps}>
              {renderFormItem(item, itemStructureStable)}
            </ElCol>
          ) : (
            renderFormItem(item, itemStructureStable)
          )
        })
    }

    // 交由调用方插槽 / schema 渲染函数渲染：清除该 field 的组件实例缓存，即使内容复用了原组件实例也不再归属表单
    const renderCustomContent = (field: string, content: any) => {
      formComponents.delete(field)
      // 记录单根 vnode：切回同类型同 key 组件时保留原 ref 的原生清理路径
      const root = Array.isArray(content) && content.length === 1 ? content[0] : undefined
      if (root) lastComponentVNodes.set(field, root)
      else lastComponentVNodes.delete(field)
      return content
    }

    // 渲染函数结果规范化为 vnode 数组：忽略 null / undefined / boolean，文本转文本节点，嵌套数组包为 Fragment
    const toVNodes = (content: unknown): VNode[] => {
      return (Array.isArray(content) ? content : [content])
        .filter((child) => child != null && typeof child !== 'boolean')
        .map((child) => {
          if (isVNode(child)) return child
          if (Array.isArray(child)) return createVNode(Fragment, null, child)
          return createTextVNode(String(child))
        })
    }

    // 渲染formItem
    const renderFormItem = (item: FormSchema, structureStable = true) => {
      // 单独给只有options属性的组件做判断
      const notRenderOptions = ['SelectV2', 'Cascader', 'Transfer']
      const slotsMap: Recordable = {
        ...setItemComponentSlots(slots, item?.componentProps?.slots, item.field)
      }
      if (
        item?.component !== 'SelectV2' &&
        item?.component !== 'Cascader' &&
        item?.component !== 'Transfer' &&
        item?.componentProps?.options
      ) {
        slotsMap.default = () => renderOptions(item)
      }
      // componentProps.slots.default 为函数时（参考上游 4d04734e1、6f1a94809、998d9f3ee）：
      // SelectV2 用作虚拟列表的行渲染，参数为行数据 item 与原插槽参数；
      // Select / Radio / Checkbox 类替换自动渲染的 options（optionsSlot 不再生效），参数为当前 options
      const defaultSlot = item?.componentProps?.slots?.default
      if (isFunction(defaultSlot)) {
        if (item.component === 'SelectV2') {
          slotsMap.default = (scope: Recordable) => defaultSlot(scope?.item, scope)
        } else if (optionSlotComponents.includes(item.component as string)) {
          slotsMap.default = () => defaultSlot(item.componentProps?.options)
        }
      }

      // formItemProps.slots 为 schema 级渲染函数，不透传给 ElFormItem
      const { slots: schemaSlots, ...formItemProps } = (item.formItemProps || {}) as Recordable
      const formItemSlots: Recordable = setFormItemSlots(slots, item.field)
      // schema 级 label / error：同名模板插槽 #field-label / #field-error 优先
      for (const name of ['label', 'error']) {
        if (!formItemSlots[name] && typeof schemaSlots?.[name] === 'function') {
          formItemSlots[name] = (...args: any[]) => schemaSlots[name](...args)
        }
      }
      // labelMessage 保留提示图标；标题内容优先使用模板插槽，其次使用 schema label，最后使用 item.label
      if (item?.labelMessage) {
        const renderLabel = formItemSlots.label
        formItemSlots.label = (...args: any[]) => {
          return (
            <>
              {renderLabel ? renderLabel(...args) : <span>{item.label}</span>}
              <ElTooltip placement="right" raw-content>
                {{
                  content: () => <span v-dompurify-html={item.labelMessage}></span>,
                  default: () => (
                    <Icon
                      icon="ep:warning"
                      size={16}
                      color="var(--el-color-primary)"
                      class="relative top-1px ml-2px"
                    ></Icon>
                  )
                }}
              </ElTooltip>
            </>
          )
        }
      }
      // schema 级 default：同名模板插槽 #field 优先
      const schemaDefault =
        !slots[item.field] && typeof schemaSlots?.default === 'function'
          ? schemaSlots.default
          : undefined
      // 自定义插槽不追加默认宽度；表单项与输入组件同时受控，便于窄容器收缩
      const inlineInputWidth = !slots[item.field] && !schemaDefault && needInlineInputWidth(item)
      const formItemVNode = (
        <ElFormItem
          key={item.field}
          v-show={!item.hidden}
          {...formItemProps}
          class={inlineInputWidth ? `${prefixCls}__inline-item` : undefined}
          prop={item.field}
          label={item.label || ''}
        >
          {{
            ...formItemSlots,
            default: () => {
              const Com = componentMap[item.component as string] as ReturnType<
                typeof defineComponent
              >

              const { autoSetPlaceholder } = unref(getProps)

              // 未传 componentProps.style 时，非 inline 表单中的组件默认宽度 100%（参考上游 416de2b4d）；
              // 传入的 style（含空对象、字符串、数组）原样使用、不合并默认值。inline 表单不追加，保持 229.5px 及范围日期原宽
              const componentStyle =
                item.componentProps?.style ||
                (isFormInline() ? item.componentProps?.style : { width: '100%' })

              // field 支持 a.b 嵌套路径，按路径读写 formModel
              const itemVal = computed({
                get: () => getModelValue(formModel.value, item.field),
                set: (val) => setModelValue(formModel.value, item.field, val)
              })

              if (slots[item.field]) {
                return renderCustomContent(item.field, getSlot(slots, item.field, formModel.value))
              }
              if (schemaDefault) {
                // schema 级 default 与模板插槽同一路径；结果规范化为 vnode 数组，不改动其中调用方的 ref
                return renderCustomContent(item.field, toVNodes(schemaDefault(formModel.value)))
              }

              // Upload（ElUpload）绑定 file-list 而不是 modelValue（参考上游 30fb2de6f）。
              // 监听键使用 camelCase，与调用方 componentProps 中的 onUpdate:fileList 合并执行而不是互相遮蔽；
              // 缺省值 '' 等非数组按空列表传入，避免 fileList 类型告警
              if (item.component === 'Upload') {
                const uploadProps = setComponentProps(item)
                // ElUpload 没有 clearable 属性，避免通用默认值落到根节点 DOM 上
                delete uploadProps.clearable
                // 内部 camel 监听存在时，Vue 不再查找调用方 kebab 写法 onUpdate:file-list(Once) 的回调；
                // 对普通、Once 两类分别做别名归一化，每类 camel 优先：已有有效 camel 时保持不变，否则改用 kebab，
                // 并删除 kebab 别名。Once 只执行一次交由 Vue 原生机制；uploadProps 为浅拷贝，不改原 schema
                for (const suffix of ['', 'Once']) {
                  const camelKey = `onUpdate:fileList${suffix}`
                  const kebabKey = `onUpdate:file-list${suffix}`
                  const kebabListener = uploadProps[kebabKey]
                  delete uploadProps[kebabKey]
                  if (kebabListener && !uploadProps[camelKey]) {
                    uploadProps[camelKey] = kebabListener
                  }
                }
                const uploadVNode = (
                  <Com
                    key={item.field}
                    {...{
                      fileList: Array.isArray(itemVal.value) ? itemVal.value : [],
                      'onUpdate:fileList': (files: unknown) => {
                        itemVal.value = files
                      }
                    }}
                    {...(autoSetPlaceholder && setTextPlaceholder(item))}
                    {...uploadProps}
                    class={inlineInputWidth ? `${prefixCls}__inline-input` : undefined}
                    style={componentStyle}
                  >
                    {{ ...slotsMap }}
                  </Com>
                )
                return trackInstance(uploadVNode, formComponents, lastComponentVNodes, item.field)
              }

              // 以 field 作为 key 区分生成组件与调用方插槽内容：切换为插槽渲染时生成组件被卸载，
              // 不会被插槽中的同类型组件复用，避免 getComponentExpose 残留实例
              const comVNode = (
                <Com
                  key={item.field}
                  vModel={itemVal.value}
                  {...(autoSetPlaceholder && setTextPlaceholder(item))}
                  {...setComponentProps(item)}
                  class={inlineInputWidth ? `${prefixCls}__inline-input` : undefined}
                  style={componentStyle}
                  {...(notRenderOptions.includes(item?.component as string) &&
                  item?.componentProps?.options
                    ? { options: item?.componentProps?.options || [] }
                    : {})}
                >
                  {{ ...slotsMap }}
                </Com>
              )
              return trackInstance(comVNode, formComponents, lastComponentVNodes, item.field)
            }
          }}
        </ElFormItem>
      )
      return trackInstance(
        formItemVNode,
        formItemComponents,
        lastFormItemVNodes,
        item.field,
        structureStable,
        lastComponentVNodes
      )
    }

    // 渲染options
    const renderOptions = (item: FormSchema) => {
      switch (item.component) {
        case 'Select':
        case 'SelectV2':
          const { renderSelectOptions } = useRenderSelect(slots)
          return renderSelectOptions(item)
        case 'Radio':
        case 'RadioGroup':
        case 'RadioButton':
          const { renderRadioOptions } = useRenderRadio()
          return renderRadioOptions(item)
        case 'Checkbox':
        case 'CheckboxGroup':
        case 'CheckboxButton':
          const { renderCheckboxOptions } = useRenderCheckbox()
          return renderCheckboxOptions(item)
        default:
          break
      }
    }

    // 过滤传入Form组件的属性
    const getFormBindValue = () => {
      // 避免在标签上出现多余的属性
      const delKeys = [
        'schema',
        'isCol',
        'autoSetPlaceholder',
        'isCustom',
        'model',
        'pruneRemovedFields'
      ]
      const props = { ...unref(getProps) }
      for (const key in props) {
        if (delKeys.indexOf(key) !== -1) {
          delete props[key]
        }
      }
      return props
    }

    return () => (
      <ElForm
        ref={elFormRef}
        {...getFormBindValue()}
        model={unref(getProps).isCustom ? unref(getProps).model : formModel}
        class={prefixCls}
        v-loading={props.vLoading}
        // 阻止原生 submit 默认动作，避免单输入框回车整页刷新；调用方 @submit 监听仍会触发
        // @ts-ignore
        onSubmit={(e: Event) => {
          e.preventDefault()
        }}
      >
        {{
          // 如果需要自定义，就什么都不渲染，而是提供默认插槽
          default: () => {
            const { isCustom } = unref(getProps)
            return isCustom ? getSlot(slots, 'default') : renderWrap()
          }
        }}
      </ElForm>
    )
  }
})
</script>

<style lang="scss" scoped>
.#{$elNamespace}-form.#{$namespace}-form .#{$elNamespace}-row {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

// 仅 inline 模式生效；显式 width/minWidth/maxWidth 的组件及其表单项不带这两个 class
// 空间充足时输入宽 229.5px；容器不足时表单项不超出容器（扣除 EP inline 的 margin-right 32px），输入随之收缩
.#{$elNamespace}-form--inline {
  :deep(.#{$namespace}-form__inline-item) {
    max-width: calc(100% - 32px);
  }

  :deep(.#{$namespace}-form__inline-input) {
    width: 229.5px;
    max-width: 100%;
  }
}
</style>
