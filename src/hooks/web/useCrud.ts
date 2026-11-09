import {
  getCurrentInstance,
  getCurrentScope,
  nextTick,
  onMounted,
  onScopeDispose,
  ref,
  watch,
  type Ref
} from 'vue'

/**
 * 可选的通用 CRUD 状态 hook（参考上游 c7f8db52d packages/hooks/useCrud，类型名 CrudMutation 参考 14d2bec7b）
 *
 * - 与现有 useTable 相互独立，不替换业务中直接使用的 el-table
 * - service 的分页参数为 pageIndex / pageSize，芋道接口的 pageNo 由 service 自行适配，例如：
 *   list: ({ pageIndex, ...params }) => XxxApi.getXxxPage({ ...params, pageNo: pageIndex })
 * - 取消是协作式的：通过 context.signal 通知 service；service 忽略 signal 时 Promise 不必立即结束，
 *   但取消、reset 或作用域销毁后，晚到的结果与错误不再写入当前状态，也不再触发刷新
 * - query 只浅复制顶层字段，嵌套对象与调用方共享引用
 */
export type CrudKey = string | number
export type CrudQuery = Record<string, unknown>
export type CrudMutation = 'create' | 'update' | 'remove'
export type CrudRequestScope = 'list' | 'detail' | 'mutation' | 'all'

export interface CrudPagination {
  pageIndex: number
  pageSize: number
}

export type CrudListParams<Query extends CrudQuery> = Query & CrudPagination

export interface CrudListResult<Row> {
  list: Row[]
  total?: number
}

export interface CrudRequestContext {
  signal: AbortSignal
}

export interface CrudService<
  Row,
  Detail = Row,
  Query extends CrudQuery = CrudQuery,
  CreateInput = Partial<Row>,
  UpdateInput = Partial<Row>,
  Key extends CrudKey = CrudKey
> {
  list: (params: CrudListParams<Query>, context: CrudRequestContext) => Promise<CrudListResult<Row>>
  detail?: (key: Key, context: CrudRequestContext) => Promise<Detail>
  create?: (input: CreateInput, context: CrudRequestContext) => Promise<unknown>
  update?: (key: Key, input: UpdateInput, context: CrudRequestContext) => Promise<unknown>
  remove?: (keys: Key[], context: CrudRequestContext) => Promise<unknown>
}

export interface UseCrudOptions<
  Row,
  Detail = Row,
  Query extends CrudQuery = CrudQuery,
  CreateInput = Partial<Row>,
  UpdateInput = Partial<Row>,
  Key extends CrudKey = CrudKey
> {
  service: CrudService<Row, Detail, Query, CreateInput, UpdateInput, Key>
  immediate?: boolean
  initialQuery?: Query
  initialPage?: number
  initialPageSize?: number
}

export interface CrudRefreshOptions {
  resetPage?: boolean
}

export interface CrudMutationOptions extends CrudRefreshOptions {
  refresh?: boolean
}

export interface CrudResetOptions {
  fetch?: boolean
}

const abortError = () =>
  Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })

const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError'

const normalizePageValue = (value: number) =>
  Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1

export const useCrud = <
  Row,
  Detail = Row,
  Query extends CrudQuery = CrudQuery,
  CreateInput = Partial<Row>,
  UpdateInput = Partial<Row>,
  Key extends CrudKey = CrudKey
>(
  options: UseCrudOptions<Row, Detail, Query, CreateInput, UpdateInput, Key>
) => {
  const createInitialQuery = () => ({ ...(options.initialQuery ?? ({} as Query)) }) as Query
  const initialPage = normalizePageValue(options.initialPage ?? 1)
  const initialPageSize = normalizePageValue(options.initialPageSize ?? 10)

  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const total = ref(0)
  const items = ref<Row[]>([]) as Ref<Row[]>
  const query = ref(createInitialQuery()) as Ref<Query>
  const current = ref<Detail | null>(null) as Ref<Detail | null>
  const currentKey = ref<Key | null>(null) as Ref<Key | null>
  const selectedKeys = ref<Key[]>([]) as Ref<Key[]>

  const listLoading = ref(false)
  const detailLoading = ref(false)
  const mutationLoading = ref(false)
  const mutationType = ref<CrudMutation | null>(null)

  const listError = ref<unknown>(null)
  const detailError = ref<unknown>(null)
  const mutationError = ref<unknown>(null)

  // 列表、详情请求代次：只有最新一次请求可写入状态
  let listRequest = 0
  let detailRequest = 0
  let listController: AbortController | undefined
  let detailController: AbortController | undefined
  // 变更代次：cancel('mutation' | 'all')、reset 后递增，作废此前仍在进行中的变更
  let mutationEpoch = 0
  // 进行中的变更（按开始顺序）；mutationType 取最近开始且仍在进行中的一项
  const activeMutations: { type: CrudMutation; controller: AbortController }[] = []
  // 内部主动修改页码时，抑制页码 watch 对这次修改的请求：只匹配当时设置的页码 / 页大小，
  // 等待结束后无论 watch 是否触发都释放，避免页码被改回等情况下标记残留、吞掉之后的正常翻页
  let suppressedPagination: { page: number; pageSize: number } | undefined
  let disposed = false

  const suppressPaginationFetch = () => {
    const token = { page: page.value, pageSize: pageSize.value }
    suppressedPagination = token
    return token
  }

  const releasePaginationFetch = (token: { page: number; pageSize: number }) => {
    if (suppressedPagination === token) suppressedPagination = undefined
  }

  // 等待期间列表流程是否已作废：cancel('list' | 'all')、reset、作用域销毁或已有更新的列表请求
  const isListStale = (request: number) => disposed || request !== listRequest

  const syncMutationState = () => {
    mutationLoading.value = activeMutations.length > 0
    mutationType.value = activeMutations.length
      ? activeMutations[activeMutations.length - 1].type
      : null
  }

  const fetchList = async () => {
    // 作用域销毁后不再发起请求
    if (disposed) throw abortError()
    const request = ++listRequest
    listController?.abort()
    const controller = new AbortController()
    listController = controller
    listLoading.value = true
    listError.value = null

    try {
      const result = await options.service.list(
        {
          ...query.value,
          pageIndex: page.value,
          pageSize: pageSize.value
        } as CrudListParams<Query>,
        { signal: controller.signal }
      )

      if (controller.signal.aborted) throw abortError()
      if (request === listRequest) {
        items.value = result.list
        total.value = result.total ?? result.list.length
      }
      return result
    } catch (error) {
      if (request === listRequest && !isAbortError(error)) {
        listError.value = error
      }
      throw error
    } finally {
      if (request === listRequest) {
        listLoading.value = false
        listController = undefined
      }
    }
  }

  const refresh = async ({ resetPage = false }: CrudRefreshOptions = {}) => {
    if (resetPage && page.value !== 1) {
      const request = listRequest
      page.value = 1
      const token = suppressPaginationFetch()
      await nextTick()
      releasePaginationFetch(token)
      // 等待页码更新期间被取消、reset 或销毁：不再发起已作废的请求
      if (isListStale(request)) throw abortError()
    }
    return fetchList()
  }

  const search = async (params: Query) => {
    query.value = { ...params }
    return refresh({ resetPage: true })
  }

  const resetSearch = () => search(createInitialQuery())

  const fetchDetail = async (key: Key) => {
    if (!options.service.detail) {
      const error = new Error('detail is not configured')
      detailError.value = error
      throw error
    }

    const request = ++detailRequest
    detailController?.abort()
    const controller = new AbortController()
    detailController = controller
    currentKey.value = key
    detailLoading.value = true
    detailError.value = null

    try {
      const result = await options.service.detail(key, { signal: controller.signal })
      if (controller.signal.aborted) throw abortError()
      if (request === detailRequest) current.value = result
      return result
    } catch (error) {
      if (request === detailRequest && !isAbortError(error)) {
        detailError.value = error
      }
      throw error
    } finally {
      if (request === detailRequest) {
        detailLoading.value = false
        detailController = undefined
      }
    }
  }

  // 变更是否仍有效：未被取消、reset，且所在作用域未销毁
  const isMutationCurrent = (epoch: number) => epoch === mutationEpoch && !disposed

  const runMutation = async <Result>(
    type: CrudMutation,
    action: ((context: CrudRequestContext) => Promise<Result>) | undefined,
    mutationOptions: CrudMutationOptions,
    afterSuccess = () => refresh({ resetPage: mutationOptions.resetPage })
  ) => {
    if (!action) {
      const error = new Error(`${type} is not configured`)
      mutationError.value = error
      throw error
    }

    const epoch = mutationEpoch
    const entry = { type, controller: new AbortController() }
    activeMutations.push(entry)
    syncMutationState()
    mutationError.value = null

    let result: Result
    try {
      result = await action({ signal: entry.controller.signal })
      if (entry.controller.signal.aborted) throw abortError()
    } catch (error) {
      // 已被取消或 reset 的变更，迟到的错误不写入当前状态
      if (isMutationCurrent(epoch) && !isAbortError(error)) mutationError.value = error
      throw error
    } finally {
      // 已被 cancel 移出的变更不再改动当前的 loading / type
      const index = activeMutations.indexOf(entry)
      if (index !== -1) {
        activeMutations.splice(index, 1)
        syncMutationState()
      }
    }

    if (mutationOptions.refresh !== false && isMutationCurrent(epoch)) await afterSuccess()
    return result
  }

  const create = (input: CreateInput, mutationOptions: CrudMutationOptions = {}) =>
    runMutation(
      'create',
      options.service.create ? (context) => options.service.create!(input, context) : undefined,
      mutationOptions
    )

  const update = (key: Key, input: UpdateInput, mutationOptions: CrudMutationOptions = {}) =>
    runMutation(
      'update',
      options.service.update
        ? (context) => options.service.update!(key, input, context)
        : undefined,
      mutationOptions
    )

  const remove = async (keys: Key[], mutationOptions: CrudMutationOptions = {}) => {
    const uniqueKeys = [...new Set(keys)]
    if (uniqueKeys.length === 0) return undefined

    const epoch = mutationEpoch
    const result = await runMutation(
      'remove',
      options.service.remove
        ? (context) => options.service.remove!(uniqueKeys, context)
        : undefined,
      { ...mutationOptions, refresh: false }
    )
    // 已取消、reset 或作用域销毁后，不再修改选择与页码
    if (!isMutationCurrent(epoch)) return result

    const removed = new Set(uniqueKeys)
    selectedKeys.value = selectedKeys.value.filter((key) => !removed.has(key))

    if (mutationOptions.refresh !== false) {
      // 删除后当前页超出总页数时，收敛到删除后的最后一页
      const lastPage = Math.max(
        1,
        Math.ceil(Math.max(0, total.value - uniqueKeys.length) / pageSize.value)
      )
      const targetPage = mutationOptions.resetPage ? 1 : Math.min(page.value, lastPage)

      if (page.value !== targetPage) {
        const request = listRequest
        page.value = targetPage
        const token = suppressPaginationFetch()
        await nextTick()
        releasePaginationFetch(token)
        // 等待页码更新期间被取消、reset 或销毁：删除已成功，只是不再刷新
        if (!isMutationCurrent(epoch) || isListStale(request)) return result
      }
      await fetchList()
    }

    return result
  }

  const setPage = (value: number) => {
    page.value = normalizePageValue(value)
  }

  const setPageSize = (value: number) => {
    pageSize.value = normalizePageValue(value)
  }

  const toKeys = (keys: Key | readonly Key[]) =>
    (Array.isArray(keys) ? keys : [keys]) as readonly Key[]

  const setSelection = (keys: readonly Key[]) => {
    selectedKeys.value = [...new Set(keys)]
  }

  const select = (keys: Key | readonly Key[]) => {
    setSelection([...selectedKeys.value, ...toKeys(keys)])
  }

  const unselect = (keys: Key | readonly Key[]) => {
    const removing = new Set(toKeys(keys))
    selectedKeys.value = selectedKeys.value.filter((key) => !removing.has(key))
  }

  const toggle = (key: Key) => {
    if (selectedKeys.value.includes(key)) unselect(key)
    else select(key)
  }

  const isSelected = (key: Key) => selectedKeys.value.includes(key)

  const clearSelection = () => {
    selectedKeys.value = []
  }

  const clearDetail = () => {
    detailRequest += 1
    detailController?.abort()
    detailController = undefined
    detailLoading.value = false
    detailError.value = null
    current.value = null
    currentKey.value = null
  }

  const cancel = (scope: CrudRequestScope = 'all') => {
    if (scope === 'list' || scope === 'all') {
      listRequest += 1
      listController?.abort()
      listController = undefined
      listLoading.value = false
    }
    if (scope === 'detail' || scope === 'all') {
      detailRequest += 1
      detailController?.abort()
      detailController = undefined
      detailLoading.value = false
    }
    if (scope === 'mutation' || scope === 'all') {
      mutationEpoch += 1
      activeMutations.forEach((entry) => entry.controller.abort())
      activeMutations.length = 0
      syncMutationState()
    }
  }

  const reset = async ({ fetch = false }: CrudResetOptions = {}) => {
    cancel()
    const request = listRequest
    const paginationChanged = page.value !== initialPage || pageSize.value !== initialPageSize

    page.value = initialPage
    pageSize.value = initialPageSize
    const token = paginationChanged ? suppressPaginationFetch() : undefined
    total.value = 0
    items.value = []
    query.value = createInitialQuery()
    current.value = null
    currentKey.value = null
    selectedKeys.value = []
    listError.value = null
    detailError.value = null
    mutationError.value = null
    await nextTick()
    token && releasePaginationFetch(token)

    if (fetch) {
      // 等待期间再次取消、reset 或销毁：不再发起已作废的请求
      if (isListStale(request)) throw abortError()
      return fetchList()
    }
    return undefined
  }

  watch([page, pageSize], ([nextPage, nextSize], [, previousSize]) => {
    if (
      suppressedPagination &&
      suppressedPagination.page === nextPage &&
      suppressedPagination.pageSize === nextSize
    ) {
      suppressedPagination = undefined
      return
    }
    if (nextSize !== previousSize && nextPage !== 1) {
      page.value = 1
      return
    }
    void fetchList().catch(() => undefined)
  })

  const start = () => void fetchList().catch(() => undefined)
  if (options.immediate !== false) {
    if (getCurrentInstance()) onMounted(start)
    else start()
  }

  // 作用域销毁：取消进行中的请求，迟到的变更不再刷新
  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      cancel()
    })
  }

  return {
    state: {
      page,
      pageSize,
      total,
      items,
      query,
      current,
      currentKey,
      selectedKeys,
      listLoading,
      detailLoading,
      mutationLoading,
      mutationType,
      listError,
      detailError,
      mutationError
    },
    actions: {
      fetchList,
      refresh,
      search,
      resetSearch,
      fetchDetail,
      clearDetail,
      create,
      update,
      remove,
      setPage,
      setPageSize,
      setSelection,
      select,
      unselect,
      toggle,
      isSelected,
      clearSelection,
      cancel,
      reset
    }
  }
}
