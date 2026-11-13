import { reactive } from 'vue'
import { AxiosPromise } from 'axios'
import { findIndex } from '@/utils'
import { eachTree, filter, treeMap } from '@/utils/tree'
import { getBoolDictOptions, getDictOptions, getIntDictOptions } from '@/utils/dict'

import type { ComponentOptions, ComponentProps, FormSchema } from '@/components/Form'
import { TableColumn } from '@/types/table'
import { DescriptionsSchema } from '@/types/descriptions'
import { DictTag } from '@/components/DictTag'
import { getOptionFields } from '@/components/Form/src/components/useRenderSelect'
import { cloneDeep, merge } from 'lodash-es'

export type CrudSchema = Omit<TableColumn, 'children'> & {
  isSearch?: boolean // 是否在查询显示
  search?: CrudSearchParams // 查询的详细配置
  isTable?: boolean // 是否在列表显示
  table?: CrudTableParams // 列表的详细配置
  isForm?: boolean // 是否在表单显示
  form?: CrudFormParams // 表单的详细配置
  isDetail?: boolean // 是否在详情显示
  detail?: CrudDescriptionsParams // 详情的详细配置
  children?: CrudSchema[]
  dictType?: string // 字典类型
  dictClass?: 'string' | 'number' | 'boolean' // 字典数据类型 string | number | boolean
}

type CrudSearchParams = {
  // 是否显示在查询项
  show?: boolean
  // 接口
  api?: () => Promise<any>
  // 搜索字段
  field?: string
} & Omit<FormSchema, 'field'>

type CrudTableParams = {
  // 是否显示表头
  show?: boolean
  // 列宽配置
  width?: number | string
  // 列是否固定在左侧或者右侧
  fixed?: 'left' | 'right'
} & Omit<FormSchema, 'field'>
type CrudFormParams = {
  // 是否显示表单项
  show?: boolean
  // 接口
  api?: () => Promise<any>
} & Omit<FormSchema, 'field'>

type CrudDescriptionsParams = {
  // 是否显示表单项
  show?: boolean
} & Omit<DescriptionsSchema, 'field'>

interface AllSchemas {
  searchSchema: FormSchema[]
  tableColumns: TableColumn[]
  formSchema: FormSchema[]
  detailSchema: DescriptionsSchema[]
}

export type UseCrudSchemasOptions = {
  // 为 true 时，search.hidden === true 的字段不生成查询项，也不请求其 search.api（参考上游 c77586c56）；
  // 默认 false：保持 isSearch / search.show 的原行为，search.hidden 原样透传给查询表单
  excludeHiddenSearchFields?: boolean
}

// 过滤所有结构
export const useCrudSchemas = (
  crudSchema: CrudSchema[],
  options: UseCrudSchemasOptions = {}
): {
  allSchemas: AllSchemas
} => {
  // 所有结构数据
  const allSchemas = reactive<AllSchemas>({
    searchSchema: [],
    tableColumns: [],
    formSchema: [],
    detailSchema: []
  })

  const searchSchema = filterSearchSchema(crudSchema, allSchemas, options)
  allSchemas.searchSchema = searchSchema || []

  const tableColumns = filterTableSchema(crudSchema)
  allSchemas.tableColumns = tableColumns || []

  const formSchema = filterFormSchema(crudSchema, allSchemas)
  allSchemas.formSchema = formSchema

  const detailSchema = filterDescriptionsSchema(crudSchema)
  allSchemas.detailSchema = detailSchema

  return {
    allSchemas
  }
}

// 过滤 Search 结构
const filterSearchSchema = (
  crudSchema: CrudSchema[],
  allSchemas: AllSchemas,
  options: UseCrudSchemasOptions = {}
): FormSchema[] => {
  const searchSchema: FormSchema[] = []

  // 获取字典列表队列
  const searchRequestTask: Array<() => Promise<void>> = []
  eachTree(crudSchema, (schemaItem: CrudSchema) => {
    // 显式开启 excludeHiddenSearchFields 时，跳过 search.hidden 的字段
    if (options.excludeHiddenSearchFields && schemaItem.search?.hidden === true) {
      return
    }
    // 判断是否显示
    if (schemaItem?.isSearch || schemaItem.search?.show) {
      let component = schemaItem?.search?.component || 'Input'
      const options: ComponentOptions[] = []
      let comonentProps: ComponentProps = {}
      if (schemaItem.dictType) {
        const allOptions: ComponentOptions = { label: '全部', value: '' }
        options.push(allOptions)
        getDictOptions(schemaItem.dictType).forEach((dict) => {
          options.push(dict)
        })
        comonentProps = {
          options: options
        }
        if (!schemaItem.search?.component) component = 'Select'
      }

      // updated by AKing: 解决了当使用默认的dict选项时，form中事件不能触发的问题
      const searchSchemaItem = merge(
        {
          // 默认为 input
          component,
          ...schemaItem.search,
          // 显式设置 search.field 时使用该字段，否则与列字段一致
          field: schemaItem.search?.field || schemaItem.field,
          label: schemaItem.search?.label || schemaItem.label
        },
        { componentProps: comonentProps }
      )
      if (searchSchemaItem.api) {
        searchRequestTask.push(async () => {
          const res = await (searchSchemaItem.api as () => AxiosPromise)()
          if (res) {
            const index = findIndex(allSchemas.searchSchema, (v: FormSchema) => {
              return v.field === searchSchemaItem.field
            })
            if (index !== -1) {
              const schema = allSchemas.searchSchema[index]!
              schema.componentProps!.options = filterOptions(
                res,
                schema.component,
                schema.componentProps
              )
            }
          }
        })
      }
      // 删除不必要的字段
      delete searchSchemaItem.show

      searchSchema.push(searchSchemaItem)
    }
  })
  for (const task of searchRequestTask) {
    task()
  }
  return searchSchema
}

// 过滤 table 结构
const filterTableSchema = (crudSchema: CrudSchema[]): TableColumn[] => {
  const tableColumns = treeMap<CrudSchema>(crudSchema, {
    conversion: (schema: CrudSchema) => {
      if (schema?.isTable !== false && schema?.table?.show !== false) {
        // add by 芋艿：增加对 dict 字典数据的支持
        if (!schema.formatter && schema.dictType) {
          schema.formatter = (_: Recordable, __: TableColumn, cellValue: any) => {
            return h(DictTag, {
              type: schema.dictType!, // ! 表示一定不为空
              value: cellValue
            })
          }
        }
        // table 内的配置优先于通用配置（如 label、width、formatter）
        return {
          ...schema,
          ...schema.table
        }
      }
    }
  })

  // 第一次过滤会有 undefined 所以需要二次过滤
  return filter<TableColumn>(tableColumns as TableColumn[], (data) => {
    if (data.children === void 0) {
      delete data.children
    }
    return !!data.field
  })
}

// 过滤 form 结构
const filterFormSchema = (crudSchema: CrudSchema[], allSchemas: AllSchemas): FormSchema[] => {
  const formSchema: FormSchema[] = []

  // 获取字典列表队列
  const formRequestTask: Array<() => Promise<void>> = []

  eachTree(crudSchema, (schemaItem: CrudSchema) => {
    // 判断是否显示
    if (schemaItem?.isForm !== false && schemaItem?.form?.show !== false) {
      let component = schemaItem?.form?.component || 'Input'
      let defaultValue: any = ''
      if (schemaItem.form?.value) {
        defaultValue = schemaItem.form?.value
      } else {
        if (component === 'InputNumber') {
          defaultValue = 0
        } else if (component === 'CheckboxGroup') {
          defaultValue = []
        } else if (component === 'JsonEditor') {
          defaultValue = {}
        }
      }
      let comonentProps: ComponentProps = {}
      if (schemaItem.dictType) {
        const options: ComponentOptions[] = []
        if (schemaItem.dictClass && schemaItem.dictClass === 'number') {
          getIntDictOptions(schemaItem.dictType).forEach((dict) => {
            options.push(dict)
          })
        } else if (schemaItem.dictClass && schemaItem.dictClass === 'boolean') {
          getBoolDictOptions(schemaItem.dictType).forEach((dict) => {
            options.push(dict)
          })
        } else {
          getDictOptions(schemaItem.dictType).forEach((dict) => {
            options.push(dict)
          })
        }
        comonentProps = {
          options: options
        }
        if (!(schemaItem.form && schemaItem.form.component)) component = 'Select'
      }

      // updated by AKing: 解决了当使用默认的dict选项时，form中事件不能触发的问题
      const formSchemaItem = merge(
        {
          // 默认为 input
          component,
          value: defaultValue,
          ...schemaItem.form,
          field: schemaItem.field,
          label: schemaItem.form?.label || schemaItem.label
        },
        { componentProps: comonentProps }
      )

      if (formSchemaItem.api) {
        formRequestTask.push(async () => {
          const res = await (formSchemaItem.api as () => AxiosPromise)()
          if (res) {
            const index = findIndex(allSchemas.formSchema, (v: FormSchema) => {
              return v.field === formSchemaItem.field
            })
            if (index !== -1) {
              const schema = allSchemas.formSchema[index]!
              schema.componentProps!.options = filterOptions(
                res,
                schema.component,
                schema.componentProps
              )
            }
          }
        })
      }

      // 删除不必要的字段
      delete formSchemaItem.show

      formSchema.push(formSchemaItem)
    }
  })

  for (const task of formRequestTask) {
    task()
  }
  return formSchema
}

// 过滤 descriptions 结构
const filterDescriptionsSchema = (crudSchema: CrudSchema[]): DescriptionsSchema[] => {
  const descriptionsSchema: FormSchema[] = []

  eachTree(crudSchema, (schemaItem: CrudSchema) => {
    // 判断是否显示
    if (schemaItem?.isDetail !== false && schemaItem.detail?.show !== false) {
      const descriptionsSchemaItem = {
        ...schemaItem.detail,
        field: schemaItem.field,
        label: schemaItem.detail?.label || schemaItem.label
      }
      if (schemaItem.dictType) {
        descriptionsSchemaItem.dictType = schemaItem.dictType
      }
      if (schemaItem.detail?.dateFormat || schemaItem.formatter == 'formatDate') {
        // 优先使用 detail 下的配置，如果没有默认为 YYYY-MM-DD HH:mm:ss
        descriptionsSchemaItem.dateFormat = schemaItem?.detail?.dateFormat
          ? schemaItem?.detail?.dateFormat
          : 'YYYY-MM-DD HH:mm:ss'
      }

      // 删除不必要的字段
      delete descriptionsSchemaItem.show

      descriptionsSchema.push(descriptionsSchemaItem)
    }
  })

  return descriptionsSchema
}

// 给options添加国际化：标签字段与 Form 渲染一致（Transfer 见 FormTransfer，props.label 优先；
// SelectV2 / Cascader 原样透传给 Element Plus，只认 props.label / props.value，默认 label / value；
// 其余见 getOptionFields，optionsAlias.labelField 优先，其次 props.label，默认 label）。
// 标签字段同时是取值字段时保留原值，避免改变 v-model 取值与回显；仅翻译字符串，返回浅拷贝不修改接口返回的选项。
// 翻译函数在调用时获取，避免模块加载时 i18n 尚未初始化
const filterOptions = (
  options: Recordable,
  component?: string,
  componentProps?: ComponentProps
) => {
  const { t } = useI18n()
  const { optionsAlias, props } = (componentProps || {}) as Recordable
  const optionFields = getOptionFields({ componentProps } as FormSchema)
  const isTransfer = component === 'Transfer'
  const isNative = component === 'SelectV2' || component === 'Cascader'
  const labelField: string = isTransfer
    ? (props?.label ?? optionsAlias?.labelField ?? 'label')
    : isNative
      ? props?.label || 'label'
      : optionFields.labelField
  // Transfer 未配置 key 字段时逐项取值：有 value 字段用 value，否则用 key；
  // SelectV2 / Cascader 为 props.value（默认 value），其余为 getOptionFields 的取值字段
  const transferKeyField = props?.key ?? optionsAlias?.valueField
  const valueFields = isTransfer
    ? [transferKeyField]
    : [isNative ? props?.value || 'value' : optionFields.valueField]
  if (valueFields.includes(labelField)) {
    return options
  }
  return options?.map((v: Recordable) => {
    if (!v || typeof v[labelField] !== 'string') {
      return v
    }
    if (isTransfer && transferKeyField === undefined) {
      const itemKeyField = Object.prototype.hasOwnProperty.call(v, 'value') ? 'value' : 'key'
      if (itemKeyField === labelField) {
        return v
      }
    }
    return { ...v, [labelField]: t(v[labelField]) }
  })
}

// 将 tableColumns 指定 fields 放到最前面
export const sortTableColumns = (tableColumns: TableColumn[], field: string) => {
  const fieldIndex = tableColumns.findIndex((item) => item.field === field)
  const fieldColumn = cloneDeep(tableColumns[fieldIndex])
  tableColumns.splice(fieldIndex, 1)
  // 添加到开头
  tableColumns.unshift(fieldColumn)
}
