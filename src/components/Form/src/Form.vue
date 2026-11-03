<script lang="tsx">
import { cloneVNode, computed, defineComponent, onMounted, PropType, ref, unref, watch } from 'vue'
import type { VNode } from 'vue'
import { ElCol, ElForm, ElFormItem, ElRow, ElTooltip } from 'element-plus'
import { componentMap } from './componentMap'
import { propTypes } from '@/utils/propTypes'
import { getSlot } from '@/utils/tsxHelper'
import {
  getModelValue,
  initModel,
  setComponentProps,
  setFormItemSlots,
  setGridProp,
  setItemComponentSlots,
  setModelValue,
  setTextPlaceholder
} from './helper'
import { useRenderSelect } from './components/useRenderSelect'
import { useRenderRadio } from './components/useRenderRadio'
import { useRenderCheckbox } from './components/useRenderCheckbox'
import { useDesign } from '@/hooks/web/useDesign'
import { findIndex } from '@/utils'
import { cloneDeep, cloneDeepWith, isObject, isPlainObject, set } from 'lodash-es'
import { FormProps } from './types'
import { Icon } from '@/components/Icon'
import { FormSchema, FormSetPropsType } from '@/types/form'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('form')

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
    vLoading: propTypes.bool.def(false)
  },
  emits: ['register'],
  setup(props, { slots, expose, emit }) {
    // element form 实例
    const elFormRef = ref<ComponentRef<typeof ElForm>>()

    const mergeProps = ref<FormProps>({})

    const getProps = computed(() => {
      const propsObj = { ...props }
      Object.assign(propsObj, unref(mergeProps))
      return propsObj
    })

    // 表单数据
    const formModel = ref<Recordable>(cloneDeep(props.model))

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

    const setSchema = (schemaProps: FormSetPropsType[]) => {
      const { schema } = unref(getProps)
      for (const v of schema) {
        for (const item of schemaProps) {
          if (v.field === item.field) {
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

    // 监听表单结构化数组，重新生成formModel
    watch(
      () => unref(getProps).schema,
      (schema = []) => {
        formModel.value = initModel(schema, unref(formModel))
      },
      {
        immediate: true,
        deep: true
      }
    )

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

    // 是否要渲染el-col
    const renderFormItemWrap = () => {
      // hidden属性表示隐藏，不做渲染
      const { schema = [], isCol } = unref(getProps)
      // 栅格布局切换时，表单项会整体重新挂载
      const structureStable = lastIsCol === isCol
      lastIsCol = isCol
      const fields = new Set(schema.filter((item) => !item.hidden).map((item) => item.field))
      for (const field of lastColKeys.keys()) {
        if (!fields.has(field)) lastColKeys.delete(field)
      }

      // 各表单项根节点以 field 作为 key：隐藏、删除、调整顺序时按字段移动/卸载节点，
      // 避免按位置复用到其他字段，导致实例（校验、重置、按 field 获取的实例）错位
      return schema
        .filter((v) => !v.hidden)
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
          const Com = componentMap['Divider'] as ReturnType<typeof defineComponent>
          return isDivider ? (
            <Com key={item.field} {...{ contentPosition: 'left', ...item.componentProps }}>
              {item?.label}
            </Com>
          ) : isCol ? (
            // 如果需要栅格，需要包裹 ElCol
            <ElCol key={item.field} {...colProps}>
              {renderFormItem(item, itemStructureStable)}
            </ElCol>
          ) : (
            renderFormItem(item, itemStructureStable)
          )
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

      const formItemSlots: Recordable = setFormItemSlots(slots, item.field)
      // 如果有 labelMessage，自动使用插槽渲染
      if (item?.labelMessage) {
        formItemSlots.label = () => {
          return (
            <>
              <span>{item.label}</span>
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
      // 自定义插槽不追加默认宽度；表单项与输入组件同时受控，便于窄容器收缩
      const inlineInputWidth = !slots[item.field] && needInlineInputWidth(item)
      const formItemVNode = (
        <ElFormItem
          key={item.field}
          {...(item.formItemProps || {})}
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

              // field 支持 a.b 嵌套路径，按路径读写 formModel
              const itemVal = computed({
                get: () => getModelValue(formModel.value, item.field),
                set: (val) => setModelValue(formModel.value, item.field, val)
              })

              if (slots[item.field]) {
                // 交由调用方插槽渲染：清除该 field 的组件实例缓存，即使插槽内容复用了原组件实例也不再归属表单
                formComponents.delete(item.field)
                const content = getSlot(slots, item.field, formModel.value)
                // 记录单根插槽 vnode：切回同类型同 key 组件时保留原 ref 的原生清理路径
                const root = Array.isArray(content) && content.length === 1 ? content[0] : undefined
                if (root) lastComponentVNodes.set(item.field, root)
                else lastComponentVNodes.delete(item.field)
                return content
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
                  style={item.componentProps?.style}
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
        case 'RadioButton':
          const { renderRadioOptions } = useRenderRadio()
          return renderRadioOptions(item)
        case 'Checkbox':
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
      const delKeys = ['schema', 'isCol', 'autoSetPlaceholder', 'isCustom', 'model']
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
