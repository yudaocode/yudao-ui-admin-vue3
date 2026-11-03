import type { SearchExpose, SearchProps } from '@/components/Search'
import { FormSchema, FormSetPropsType } from '@/types/form'
import type { ElForm } from 'element-plus'

/**
 * Search 组件的操作 hook（参考上游 a00d76e41）：
 * <Search @register="searchRegister" /> 注册后，通过 searchMethods 动态修改 schema、属性与表单值
 */
export const useSearch = () => {
  // Search实例
  const searchRef = ref<SearchExpose>()

  /**
   * @param ref Search实例
   */
  const register = (ref: SearchExpose) => {
    searchRef.value = ref
  }

  const getSearch = async () => {
    await nextTick()
    const search = unref(searchRef)
    if (!search) {
      console.error('The Search is not registered. Please use the register method to register')
    }
    return search
  }

  // 一些内置的方法
  const methods: {
    setProps: (props?: SearchProps) => Promise<void>
    setValues: (data: Recordable) => Promise<void>
    setSchema: (schemaProps: FormSetPropsType[]) => Promise<void>
    addSchema: (formSchema: FormSchema, index?: number) => Promise<void>
    delSchema: (field: string) => Promise<void>
    getFormData: <T = Recordable | undefined>(filterEmptyVal?: boolean) => Promise<T>
    getElFormExpose: () => Promise<ComponentRef<typeof ElForm> | undefined>
  } = {
    /**
     * @param props 需要临时覆盖的 Search 属性，值为 undefined 时取消覆盖；含 model 时同时回填表单值
     */
    setProps: async (props: SearchProps = {}) => {
      const search = await getSearch()
      search?.setProps(props)
    },

    /**
     * @param data 需要设置的数据
     */
    setValues: async (data: Recordable) => {
      const search = await getSearch()
      search?.setValues(data)
    },

    /**
     * @param schemaProps 需要设置的schemaProps
     */
    setSchema: async (schemaProps: FormSetPropsType[]) => {
      const search = await getSearch()
      search?.setSchema(schemaProps)
    },

    /**
     * @param formSchema 需要新增数据
     * @param index 在哪里新增
     */
    addSchema: async (formSchema: FormSchema, index?: number) => {
      const search = await getSearch()
      search?.addSchema(formSchema, index)
    },

    /**
     * @param field 删除哪个数据
     */
    delSchema: async (field: string) => {
      const search = await getSearch()
      search?.delSchema(field)
    },

    /**
     * @param filterEmptyVal 是否过滤顶层空值，默认 false（与 useForm getFormData 一致）
     * @returns form data
     */
    getFormData: async <T = Recordable>(filterEmptyVal = false): Promise<T> => {
      const search = await getSearch()
      return search?.getFormData<T>(filterEmptyVal) as T
    },

    /**
     * @returns ElForm 实例
     */
    getElFormExpose: async () => {
      const search = await getSearch()
      return search?.getElFormExpose()
    }
  }

  return {
    searchRegister: register,
    searchMethods: methods
  }
}
