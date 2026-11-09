import download from '@/utils/download'
import { Table } from '@/components/Table'
import type { TableExpose } from '@/components/Table'
import { ElMessage, ElMessageBox, ElTable } from 'element-plus'
import {
  computed,
  getCurrentScope,
  nextTick,
  onScopeDispose,
  reactive,
  ref,
  unref,
  watch
} from 'vue'
import type { TableColumn, TableProps, TableSetPropsType } from '@/components/Table/src/types'
import { useI18n } from '@/hooks/web/useI18n'

interface ResponseType<T = any> {
  list: T[]
  total?: number
}

interface UseTableConfig<T = any> {
  getListApi: (option: any) => Promise<T>
  delListApi?: (option: any) => Promise<T>
  exportListApi?: (option: any) => Promise<T>
  // 返回数据格式配置
  response?: ResponseType
  // 默认传递的参数
  defaultParams?: Recordable
  props?: TableProps
}

interface TableObject<T = any> {
  pageSize: number
  currentPage: number
  total: number
  tableList: T[]
  params: any
  loading: boolean
  exportLoading: boolean
  currentRow: Nullable<T>
}

export const useTable = <T = any>(config?: UseTableConfig<T>) => {
  // 在函数内获取 i18n，支持先 import 本模块、再安装 i18n / pinia
  const { t } = useI18n()

  const tableObject = reactive<TableObject<T>>({
    // 页数
    pageSize: 10,
    // 当前页
    currentPage: 1,
    // 总条数
    total: 10,
    // 表格数据
    tableList: [],
    // AxiosConfig 配置
    params: {
      ...(config?.defaultParams || {})
    },
    // 加载中
    loading: true,
    // 导出加载中
    exportLoading: false,
    // 当前行的数据
    currentRow: null
  })

  // 列表请求代次：只有最新一次 getList 可写入列表、总数及 loading，旧的慢请求不覆盖新结果（参考上游 c7f8db52d useCrud）
  let listRequest = 0
  // 最近一次 getList 的 Promise：删除后由页码 watch 发起的刷新，供 delData 等待
  let listPromise: Promise<void> | undefined
  // 所在组件作用域是否已销毁：销毁后不再发起请求、不再写入状态
  let disposed = false
  // 所在组件作用域销毁后作废进行中的请求，晚到的响应不再回写
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      listRequest++
    })
  }

  const paramsObj = computed(() => {
    return {
      ...tableObject.params,
      pageSize: tableObject.pageSize,
      pageNo: tableObject.currentPage
    }
  })

  watch(
    () => tableObject.currentPage,
    () => {
      methods.getList()
    }
  )

  watch(
    () => tableObject.pageSize,
    () => {
      if (tableObject.currentPage === 1) {
        methods.getList()
      } else {
        // 当前页不为1时，只重置为第1页，由 currentPage 的 watch 负责请求，避免重复调用getList方法
        tableObject.currentPage = 1
      }
    }
  )

  // Table实例
  const tableRef = ref<typeof Table & TableExpose>()

  // ElTable实例
  const elTableRef = ref<ComponentRef<typeof ElTable>>()

  const register = (ref: typeof Table & TableExpose, elRef: ComponentRef<typeof ElTable>) => {
    tableRef.value = ref
    elTableRef.value = elRef
  }

  const getTable = async () => {
    await nextTick()
    const table = unref(tableRef)
    if (!table) {
      console.error('The table is not registered. Please use the register method to register')
    }
    return table
  }

  const delData = async (ids: string | number | string[] | number[]) => {
    // 去重后的删除数量，重复 id 不重复删除、不多算
    const uniqueIds: (string | number)[] =
      ids instanceof Array ? [...new Set<string | number>(ids)] : [ids]
    if (ids instanceof Array) {
      await Promise.all(
        uniqueIds.map(async (id: string | number) => {
          await (config?.delListApi && config?.delListApi(id))
        })
      )
    } else {
      await (config?.delListApi && config?.delListApi(ids))
    }
    // 删除完成前组件已销毁：不再提示成功、调整页码或刷新
    if (disposed) return
    ElMessage.success(t('common.delSuccess'))

    // 删除后当前页超出总页数时，收敛到删除后的最后一页（参考上游 c7f8db52d useCrud remove）
    const lastPage = Math.max(
      1,
      Math.ceil(Math.max(0, tableObject.total - uniqueIds.length) / tableObject.pageSize)
    )
    const targetPage = Math.min(tableObject.currentPage, lastPage)
    if (targetPage !== tableObject.currentPage) {
      // 页码变化由 currentPage 的 watch 发起刷新，这里只等待该次请求，避免重复请求
      tableObject.currentPage = targetPage
      await nextTick()
      await listPromise
    } else {
      await methods.getList()
    }
  }

  const methods = {
    getList: (): Promise<void> => {
      // 作用域销毁后不再发起请求
      if (disposed) return Promise.resolve()
      const request = ++listRequest
      const run = async () => {
        tableObject.loading = true
        try {
          const res = await config?.getListApi(unref(paramsObj))
          // 已有更新的请求（或作用域已销毁）时，丢弃本次结果
          if (res && request === listRequest) {
            tableObject.tableList = (res as unknown as ResponseType).list
            tableObject.total = (res as unknown as ResponseType).total ?? 0
          }
        } finally {
          // 旧请求结束（含失败）不清除新请求的 loading
          if (request === listRequest) {
            tableObject.loading = false
          }
        }
      }
      listPromise = run()
      return listPromise
    },
    setProps: async (props: TableProps = {}) => {
      const table = await getTable()
      table?.setProps(props)
    },
    setColumn: async (columnProps: TableSetPropsType[]) => {
      const table = await getTable()
      table?.setColumn(columnProps)
    },
    // 新版 Table 暴露的列增删方法：直接修改 Table 的源 columns 数组
    addColumn: async (column: TableColumn, index?: number) => {
      const table = await getTable()
      table?.addColumn(column, index)
    },
    delColumn: async (field: string) => {
      const table = await getTable()
      table?.delColumn(field)
    },
    getSelections: async () => {
      const table = await getTable()
      return (table?.selections || []) as T[]
    },
    // 获取 ElTable 实例（参考上游 94800b012）；未注册时返回 undefined
    getElTableExpose: async () => {
      await getTable()
      return unref(elTableRef)
    },
    // 按当前页码与查询参数重新获取数据（参考上游 882f162ff）
    refresh: (): Promise<void> => {
      return methods.getList()
    },
    // 与Search组件结合
    setSearchParams: (data: Recordable) => {
      tableObject.params = Object.assign(tableObject.params, {
        pageSize: tableObject.pageSize,
        pageNo: 1,
        ...data
      })
      // 页码不等于1时更新页码重新获取数据，页码等于1时重新获取数据
      if (tableObject.currentPage !== 1) {
        tableObject.currentPage = 1
      } else {
        methods.getList()
      }
    },
    // 删除数据
    delList: async (
      ids: string | number | string[] | number[],
      multiple: boolean,
      message = true
    ) => {
      const tableRef = await getTable()
      if (multiple) {
        if (!tableRef?.selections.length) {
          ElMessage.warning(t('common.delNoData'))
          return
        }
      }
      if (message) {
        ElMessageBox.confirm(t('common.delMessage'), t('common.confirmTitle'), {
          confirmButtonText: t('common.ok'),
          cancelButtonText: t('common.cancel'),
          type: 'warning'
        }).then(async () => {
          await delData(ids)
        })
      } else {
        await delData(ids)
      }
    },
    // 导出列表
    exportList: async (fileName: string) => {
      tableObject.exportLoading = true
      ElMessageBox.confirm(t('common.exportMessage'), t('common.confirmTitle'), {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
        .then(async () => {
          const res = await config?.exportListApi?.(unref(paramsObj) as unknown as T)
          if (res) {
            download.excel(res as unknown as Blob, fileName)
          }
        })
        .finally(() => {
          tableObject.exportLoading = false
        })
    }
  }

  config?.props && methods.setProps(config.props)

  return {
    register,
    elTableRef,
    tableObject,
    methods,
    // add by 芋艿：返回 tableMethods 属性，和 tableObject 更统一
    tableMethods: methods
  }
}
