<script lang="tsx">
import { computed, defineComponent, onMounted, PropType, ref, unref, watch } from 'vue'
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

    // useForm传入的props
    const outsideProps = ref<FormProps>({})

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
      outsideProps.value = props
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

    expose({
      setValues,
      formModel,
      setProps,
      delSchema,
      addSchema,
      setSchema,
      getElFormRef
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

      return schema
        .filter((v) => !v.hidden)
        .map((item) => {
          // 如果是 Divider 组件，需要自己占用一行
          const isDivider = item.component === 'Divider'
          const Com = componentMap['Divider'] as ReturnType<typeof defineComponent>
          return isDivider ? (
            <Com {...{ contentPosition: 'left', ...item.componentProps }}>{item?.label}</Com>
          ) : isCol ? (
            // 如果需要栅格，需要包裹 ElCol
            <ElCol {...setGridProp(item.colProps)}>{renderFormItem(item)}</ElCol>
          ) : (
            renderFormItem(item)
          )
        })
    }

    // 渲染formItem
    const renderFormItem = (item: FormSchema) => {
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
      return (
        <ElFormItem
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

              return slots[item.field] ? (
                getSlot(slots, item.field, formModel.value)
              ) : (
                <Com
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
            }
          }}
        </ElFormItem>
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
