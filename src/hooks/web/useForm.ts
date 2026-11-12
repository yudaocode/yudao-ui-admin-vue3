import type { Form, FormExpose } from '@/components/Form'
import type { ElForm, ElFormItem } from 'element-plus'
import type { FormProps } from '@/components/Form/src/types'
import { FormSchema, FormSetPropsType } from '@/types/form'
import { isPlainObject } from 'lodash-es'
import { isEmptyVal } from '@/utils/is'

export const useForm = (props?: FormProps) => {
  // From实例
  const formRef = ref<typeof Form & FormExpose>()

  // ElForm实例
  const elFormRef = ref<ComponentRef<typeof ElForm>>()

  /**
   * @param ref Form实例
   * @param elRef ElForm实例
   */
  const register = (ref: typeof Form & FormExpose, elRef: ComponentRef<typeof ElForm>) => {
    formRef.value = ref
    elFormRef.value = elRef
  }

  const getForm = async () => {
    await nextTick()
    const form = unref(formRef)
    if (!form) {
      console.error('The form is not registered. Please use the register method to register')
    }
    return form
  }

  // 一些内置的方法（参考上游 09fe3467f：setter 均为 async，类型如实标注 Promise<void>）
  const methods: {
    setProps: (props: Recordable) => Promise<void>
    setValues: (data: Recordable) => Promise<void>
    getFormData: <T = Recordable | undefined>(filterEmptyVal?: boolean) => Promise<T>
    setSchema: (schemaProps: FormSetPropsType[]) => Promise<void>
    addSchema: (formSchema: FormSchema, index?: number) => Promise<void>
    delSchema: (field: string) => Promise<void>
    getComponentExpose: <T = any>(field: string) => Promise<T | undefined>
    getFormItemExpose: (field: string) => Promise<ComponentRef<typeof ElFormItem> | undefined>
    getElFormExpose: () => Promise<ComponentRef<typeof ElForm> | undefined>
    getFormExpose: () => Promise<(typeof Form & FormExpose) | undefined>
  } = {
    setProps: async (props: FormProps = {}) => {
      const form = await getForm()
      form?.setProps(props)
      if (props.model) {
        form?.setValues(props.model)
      }
    },

    setValues: async (data: Recordable) => {
      const form = await getForm()
      form?.setValues(data)
    },

    /**
     * @param schemaProps 需要设置的schemaProps
     */
    setSchema: async (schemaProps: FormSetPropsType[]) => {
      const form = await getForm()
      form?.setSchema(schemaProps)
    },

    /**
     * @param formSchema 需要新增数据
     * @param index 在哪里新增
     */
    addSchema: async (formSchema: FormSchema, index?: number) => {
      const form = await getForm()
      form?.addSchema(formSchema, index)
    },

    /**
     * @param field 删除哪个数据
     */
    delSchema: async (field: string) => {
      const form = await getForm()
      form?.delSchema(field)
    },

    /**
     * @param filterEmptyVal 是否过滤空值（参考上游 a7f370214，上游默认 true，这里默认 false 保持原行为）：
     * 为 true 时返回新对象，只移除顶层 ''、null、undefined 与空普通对象，保留 0、false、[]；不修改原表单数据
     * @returns form data，未过滤时为表单数据原引用
     */
    getFormData: async <T = Recordable>(filterEmptyVal = false): Promise<T> => {
      const form = await getForm()
      const model = form?.formModel as Recordable | undefined
      if (!filterEmptyVal || !model) {
        return model as T
      }
      // Object.fromEntries 按自有属性逐个定义，__proto__ 等键也只作为普通属性，不会改变原型
      return Object.fromEntries(
        Object.entries(model).filter(([, value]) => {
          if (isEmptyVal(value)) return false
          return !(isPlainObject(value) && Object.keys(value).length === 0)
        })
      ) as T
    },

    /**
     * @param field 表单项 field
     * @returns 表单组件实例，插槽自定义渲染的字段返回 undefined
     */
    getComponentExpose: async <T = any>(field: string): Promise<T | undefined> => {
      const form = await getForm()
      return form?.getComponentExpose(field) as T | undefined
    },

    /**
     * @param field 表单项 field
     * @returns form-item 实例
     */
    getFormItemExpose: async (field: string) => {
      const form = await getForm()
      return form?.getFormItemExpose(field)
    },

    /**
     * @returns ElForm 实例
     */
    getElFormExpose: async () => {
      await getForm()
      return unref(elFormRef) as ComponentRef<typeof ElForm> | undefined
    },

    /**
     * @returns Form 实例
     */
    getFormExpose: async () => {
      await getForm()
      return unref(formRef) as (typeof Form & FormExpose) | undefined
    }
  }

  props && methods.setProps(props)

  return {
    register,
    elFormRef,
    // 与上游一致的 ElForm 实例别名（参考上游 09fe3467f），与 elFormRef 为同一 ref
    formRef: elFormRef,
    methods
  }
}
