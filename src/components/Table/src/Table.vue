<script lang="tsx">
import {
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElImage,
  ElEmpty,
  ElCard
} from 'element-plus'
import type { ComponentSize, ElTooltipProps } from 'element-plus'
import { defineComponent, PropType, ref, computed, unref, watch, onMounted } from 'vue'
import type { CSSProperties, VNode } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { DEFAULT_FILTER_COLUMN, getColumnKey, normalizeColumnFixed, setIndex } from './helper'
import type {
  ColumnPreference,
  TableProps,
  TableColumn,
  Pagination,
  TableSetProps,
  TableSlotDefault
} from './types'
import { set, get } from 'lodash-es'
import { getSlot } from '@/utils/tsxHelper'
import TableActions from './components/TableActions.vue'
import { Icon } from '@/components/Icon'

export default defineComponent({
  name: 'Table',
  props: {
    pageSize: propTypes.number.def(10),
    currentPage: propTypes.number.def(1),
    // 是否多选（芋道原有能力，源列中已有 selection 列时不重复生成）
    selection: propTypes.bool.def(false),
    // 是否展开行（芋道原有能力，使用 expand 插槽；源列中已有 expand 列时不重复生成）
    expand: propTypes.bool.def(false),
    // 是否展示表格的工具栏
    showAction: propTypes.bool.def(false),
    // 是否所有的超出隐藏，优先级低于schema中的showOverflowTooltip,
    showOverflowTooltip: propTypes.bool.def(true),
    // 表头
    columns: {
      type: Array as PropType<TableColumn[]>,
      default: () => []
    },
    // 列设置“还原”使用的默认列；未传时使用源列定义
    defaultColumns: {
      type: Array as PropType<TableColumn[]>,
      default: undefined
    },
    // 是否展示分页
    pagination: {
      type: Object as PropType<Pagination>,
      default: (): Pagination | undefined => undefined
    },
    // 仅对 type=selection 的列有效，类型为 Boolean，为 true 则会在数据更新之后保留之前选中的数据（需指定 row-key）
    reserveSelection: propTypes.bool.def(false),
    // 加载状态
    loading: propTypes.bool.def(false),
    // 是否叠加索引
    reserveIndex: propTypes.bool.def(false),
    // 对齐方式（芋道默认 center）
    align: propTypes.string
      .validate((v: string) => ['left', 'center', 'right'].includes(v))
      .def('center'),
    // 表头对齐方式（芋道默认 center）
    headerAlign: propTypes.string
      .validate((v: string) => ['left', 'center', 'right'].includes(v))
      .def('center'),
    data: {
      type: Array as PropType<Recordable[]>,
      default: () => []
    },
    // 图片自动预览字段数组
    imagePreview: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    // 视频自动预览字段数组
    videoPreview: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    height: propTypes.oneOfType([Number, String]),
    maxHeight: propTypes.oneOfType([Number, String]),
    stripe: propTypes.bool.def(false),
    border: propTypes.bool.def(true),
    size: {
      type: String as PropType<ComponentSize>,
      validator: (v: ComponentSize) => ['default', 'small', 'large'].includes(v)
    },
    fit: propTypes.bool.def(true),
    showHeader: propTypes.bool.def(true),
    highlightCurrentRow: propTypes.bool.def(false),
    currentRowKey: propTypes.oneOfType([Number, String]),
    // row-class-name, 类型为 (row: Recordable, rowIndex: number) => string | string
    rowClassName: {
      type: [Function, String] as PropType<(row: Recordable, rowIndex: number) => string | string>,
      default: ''
    },
    rowStyle: {
      type: [Function, Object] as PropType<
        (row: Recordable, rowIndex: number) => Recordable | CSSProperties
      >,
      default: undefined
    },
    cellClassName: {
      type: [Function, String] as PropType<
        (row: Recordable, column: any, rowIndex: number) => string | string
      >,
      default: ''
    },
    cellStyle: {
      type: [Function, Object] as PropType<
        (row: Recordable, column: any, rowIndex: number) => Recordable | CSSProperties
      >,
      default: undefined
    },
    headerRowClassName: {
      type: [Function, String] as PropType<(row: Recordable, rowIndex: number) => string | string>,
      default: ''
    },
    headerRowStyle: {
      type: [Function, Object] as PropType<
        (row: Recordable, rowIndex: number) => Recordable | CSSProperties
      >,
      default: undefined
    },
    headerCellClassName: {
      type: [Function, String] as PropType<
        (row: Recordable, column: any, rowIndex: number) => string | string
      >,
      default: ''
    },
    headerCellStyle: {
      type: [Function, Object] as PropType<
        (row: Recordable, column: any, rowIndex: number) => Recordable | CSSProperties
      >,
      default: undefined
    },
    // 与 ElTable 一致，支持字符串和函数（函数返回 string / number）
    rowKey: {
      type: [String, Function] as PropType<string | ((row: Recordable) => string | number)>,
      default: 'id'
    },
    // 未传时交给 ElementPlus 的国际化默认文案
    emptyText: propTypes.string,
    defaultExpandAll: propTypes.bool.def(false),
    expandRowKeys: {
      type: Array as PropType<string[]>,
      default: undefined
    },
    defaultSort: {
      type: Object as PropType<{ prop: string; order: string }>,
      default: () => ({})
    },
    tooltipEffect: {
      type: String as PropType<'dark' | 'light'>,
      default: 'dark'
    },
    tooltipOptions: {
      type: Object as PropType<
        Pick<
          ElTooltipProps,
          | 'effect'
          | 'enterable'
          | 'hideAfter'
          | 'offset'
          | 'placement'
          | 'popperClass'
          | 'popperOptions'
          | 'showAfter'
          | 'showArrow'
        >
      >,
      default: () => ({
        enterable: true,
        placement: 'top',
        showArrow: true,
        hideAfter: 200,
        popperOptions: { strategy: 'fixed' }
      })
    },
    showSummary: propTypes.bool.def(false),
    // 未传时交给 ElementPlus 的国际化默认文案
    sumText: propTypes.string,
    summaryMethod: {
      type: Function as PropType<(param: { columns: any[]; data: any[] }) => any[]>,
      default: undefined
    },
    spanMethod: {
      type: Function as PropType<
        (param: { row: any; column: any; rowIndex: number; columnIndex: number }) => any[]
      >,
      default: undefined
    },
    selectOnIndeterminate: propTypes.bool.def(true),
    indent: propTypes.number.def(16),
    lazy: propTypes.bool.def(false),
    load: {
      type: Function as PropType<(row: Recordable, treeNode: any, resolve: Function) => void>,
      default: undefined
    },
    treeProps: {
      type: Object as PropType<{ hasChildren?: string; children?: string; label?: string }>,
      default: () => ({ hasChildren: 'hasChildren', children: 'children', label: 'label' })
    },
    tableLayout: {
      type: String as PropType<'auto' | 'fixed'>,
      default: 'fixed'
    },
    scrollbarAlwaysOn: propTypes.bool.def(false),
    flexible: propTypes.bool.def(false),
    // 自定义内容
    customContent: propTypes.bool.def(false),
    cardBodyStyle: {
      type: Object as PropType<CSSProperties>,
      default: () => ({})
    },
    cardBodyClass: {
      type: String as PropType<string>,
      default: ''
    },
    cardWrapStyle: {
      type: Object as PropType<CSSProperties>,
      default: () => ({})
    },
    cardWrapClass: {
      type: String as PropType<string>,
      default: ''
    }
  },
  emits: ['update:pageSize', 'update:currentPage', 'register', 'refresh', 'selection-change'],
  setup(props, { attrs, emit, slots, expose }) {
    const elTableRef = ref<ComponentRef<typeof ElTable>>()

    // 注册：第二个参数为实际的 ElTable 实例，与芋道 useTable 的 register 一致
    onMounted(() => {
      const tableRef = unref(elTableRef)
      emit('register', tableRef?.$parent, elTableRef.value)
    })

    const pageSizeRef = ref(props.pageSize)

    const currentPageRef = ref(props.currentPage)

    // useTable传入的props
    const outsideProps = ref<TableProps>({})

    const mergeProps = ref<TableProps>({})

    const getProps = computed(() => {
      const propsObj = { ...props }
      Object.assign(propsObj, unref(mergeProps))
      return propsObj
    })

    const setProps = (props: TableProps = {}) => {
      mergeProps.value = Object.assign(unref(mergeProps), props)
      outsideProps.value = { ...props } as any
    }

    const setColumn = (columnProps: TableSetProps[], columnsChildren?: TableColumn[]) => {
      const { columns } = unref(getProps)
      for (const v of columnsChildren || columns) {
        for (const item of columnProps) {
          if (v.field === item.field) {
            set(v, item.path, item.value)
            // 偏好只属于顶层列：递归子列时不同步，避免同 key 的子列误改顶层列偏好
            if (!columnsChildren) syncColumnPreference(v, item)
          } else if (v.children?.length) {
            setColumn(columnProps, v.children)
          }
        }
      }
    }

    const addColumn = (column: TableColumn, index?: number) => {
      const { columns } = unref(getProps)
      if (index !== void 0) {
        columns.splice(index, 0, column)
      } else {
        columns.push(column)
      }
    }

    const delColumn = (field: string) => {
      const { columns } = unref(getProps)
      const index = columns.findIndex((item) => item.field === field)
      if (index > -1) {
        columns.splice(index, 1)
      }
    }

    const refresh = () => {
      emit('refresh')
    }

    const changSize = (size: ComponentSize) => {
      setProps({ size })
    }

    // 列设置中用户确认的偏好（按顺序），只叠加在渲染列上，不写回源列
    const columnPreferences = ref<ColumnPreference[]>([])

    const confirmSetColumn = (preferences: ColumnPreference[]) => {
      columnPreferences.value = preferences
    }

    // setColumn 显式修改 hidden / fixed 时，同步该列已有的偏好，避免被偏好值压住；
    // 没有偏好时不创建，其他属性、其他列的偏好和排序都保持不变
    const syncColumnPreference = (column: TableColumn, item: TableSetProps) => {
      if (item.path !== 'hidden' && item.path !== 'fixed') return
      const key = getColumnKey(column)
      const preferences = unref(columnPreferences)
      if (!preferences.some((preference) => preference.key === key)) return
      columnPreferences.value = preferences.map((preference) => {
        if (preference.key !== key) return preference
        return item.path === 'hidden'
          ? { ...preference, hidden: !!item.value }
          : { ...preference, fixed: normalizeColumnFixed(item.value) }
      })
    }

    // 源列：setColumn / addColumn / delColumn 修改的就是这份列（既有可变 API）
    const sourceColumns = computed<TableColumn[]>(() => unref(getProps).columns || [])

    // 列设置“还原”的默认值：优先 defaultColumns，否则使用源列定义（不是叠加偏好后的渲染列）
    const restoreColumns = computed<TableColumn[]>(() => {
      const { defaultColumns } = unref(getProps)
      return defaultColumns?.length ? defaultColumns : unref(sourceColumns)
    })

    // selection / expand 等特殊列不参与列设置
    const isSettingColumn = (column: TableColumn) =>
      !(column.type && DEFAULT_FILTER_COLUMN.includes(column.type))

    // 渲染列 = 源列 + 用户偏好：
    // 1. 未设置偏好时完全按源顺序
    // 2. 有偏好的普通列按偏好顺序排列，并套用 hidden / fixed（浅拷贝，不修改源列）
    // 3. 特殊列和尚未设置偏好的新列，按源列中的下标插回，例如 addColumn(column, 0) 仍在最前
    // 4. 已删除列的偏好直接忽略
    const renderedColumns = computed<TableColumn[]>(() => {
      const columns = unref(sourceColumns)
      const preferences = unref(columnPreferences)
      if (!preferences.length) return columns
      const preferenceMap = new Map<string, { order: number; preference: ColumnPreference }>()
      preferences.forEach((preference, order) => {
        if (!preferenceMap.has(preference.key)) {
          preferenceMap.set(preference.key, { order, preference })
        }
      })
      const ordered: { order: number; column: TableColumn }[] = []
      const rest: { index: number; column: TableColumn }[] = []
      columns.forEach((column, index) => {
        const matched =
          column && isSettingColumn(column) ? preferenceMap.get(getColumnKey(column)) : undefined
        if (matched) {
          ordered.push({
            order: matched.order,
            column: {
              ...column,
              hidden: matched.preference.hidden,
              fixed: normalizeColumnFixed(matched.preference.fixed)
            }
          })
        } else {
          rest.push({ index, column })
        }
      })
      const result = ordered.sort((a, b) => a.order - b.order).map((item) => item.column)
      rest.forEach(({ index, column }) => {
        result.splice(Math.min(index, result.length), 0, column)
      })
      return result
    })

    // 多选：内部先更新 selections，再执行 setProps 配置的回调，最后向模板监听 emit 一次
    const selections = ref<Recordable[]>([])

    // 支持单个函数或函数数组
    const callHandlers = (handler: unknown, ...args: unknown[]) => {
      const list = Array.isArray(handler) ? handler : [handler]
      list.forEach((fn) => {
        if (typeof fn === 'function') fn(...args)
      })
    }

    const selectionChange = (selection: Recordable[]) => {
      selections.value = selection
      const mergedProps = unref(getProps) as Recordable
      const camelHandler = mergedProps.onSelectionChange
      const kebabHandler = mergedProps['onSelection-change']
      callHandlers(camelHandler, selection)
      if (kebabHandler !== camelHandler) callHandlers(kebabHandler, selection)
      emit('selection-change', selection)
    }

    expose({
      setProps,
      setColumn,
      delColumn,
      addColumn,
      selections,
      elTableRef
    })

    const pagination = computed(() => {
      // update by 芋艿：保持和 Pagination 组件的逻辑一致
      return Object.assign(
        {
          small: false,
          background: true,
          pagerCount: document.body.clientWidth < 992 ? 5 : 7,
          layout: 'total, sizes, prev, pager, next, jumper',
          pageSizes: [10, 20, 30, 50, 100],
          disabled: false,
          hideOnSinglePage: false,
          total: 10
        },
        unref(getProps).pagination
      )
    })

    watch(
      () => unref(getProps).pageSize,
      (val: number) => {
        pageSizeRef.value = val
      }
    )

    watch(
      () => unref(getProps).currentPage,
      (val: number) => {
        currentPageRef.value = val
      }
    )

    watch(
      () => pageSizeRef.value,
      (val: number) => {
        emit('update:pageSize', val)
      }
    )

    watch(
      () => currentPageRef.value,
      (val: number) => {
        emit('update:currentPage', val)
      }
    )

    // 组件自用、不能透传给 ElTable 的属性
    const OMIT_BIND_KEYS = [
      'columns',
      'data',
      'align',
      'headerAlign',
      'selection',
      'expand',
      'showAction',
      'pagination',
      'pageSize',
      'currentPage',
      'reserveIndex',
      'reserveSelection',
      'loading',
      'imagePreview',
      'videoPreview',
      'defaultColumns',
      'customContent',
      'cardBodyStyle',
      'cardBodyClass',
      'cardWrapStyle',
      'cardWrapClass',
      // 由内部 selectionChange 统一调用，不能透传给 ElTable，否则会被内部监听覆盖或重复触发
      'onSelectionChange',
      'onSelection-change'
    ]

    // attrs 不是响应式对象，因此在 render 中调用；setProps 合并的属性同样生效
    const getBindValue = () => {
      const bindValue: Recordable = { ...attrs, ...unref(getProps) }
      OMIT_BIND_KEYS.forEach((key) => delete bindValue[key])
      return bindValue
    }

    // 字段是否配置了图片 / 视频预览
    const isPreviewField = (field: string) => {
      const { imagePreview = [], videoPreview = [] } = unref(getProps)
      return imagePreview.includes(field) || videoPreview.includes(field)
    }

    // 普通列（含嵌套子列）的插槽。判断插槽 / 函数是否存在，不用结果做 || 回退，formatter 返回 0、false、'' 也原样显示：
    // 内容：column.slots.default > 旧 slots[field] > formatter > 图片/视频预览 > get(row, field)
    // 表头：column.slots.header > 旧 slots[`${field}-header`]，都没有时由 ElTableColumn 显示 label
    const getColumnSlots = (v: TableColumn) => {
      const children = v.children
      const columnSlots: Recordable = {
        default: (...args: any[]) => {
          if (children && children.length) return renderTreeTableColumn(children)
          const data = args[0] as TableSlotDefault
          if (v.slots?.default) return v.slots.default(...args)
          if (v.field && slots[v.field]) return getSlot(slots, v.field, data)
          const value = get(data?.row, v.field)
          if (typeof v.formatter === 'function') {
            return v.formatter(data.row, data.column, value, data.$index)
          }
          if (isPreviewField(v.field)) return renderPreview(value, v.field)
          return value
        }
      }
      const headerSlotName = `${v.field}-header`
      if (v.slots?.header) {
        const header = v.slots.header
        columnSlots.header = (...args: any[]) => header(...args)
      } else if (v.field && slots[headerSlotName]) {
        columnSlots.header = (...args: any[]) => getSlot(slots, headerSlotName, args[0])
      }
      return columnSlots
    }

    // 普通列：children / slots 不作为 ElTableColumn 属性透传
    const renderNormalColumn = (v: TableColumn) => {
      const { align, headerAlign, showOverflowTooltip } = unref(getProps)
      const columnProps: Recordable = { ...v }
      delete columnProps.children
      delete columnProps.slots
      return (
        <ElTableColumn
          key={getColumnKey(v)}
          showOverflowTooltip={showOverflowTooltip}
          align={align}
          headerAlign={headerAlign}
          {...columnProps}
          prop={v.field}
        >
          {getColumnSlots(v)}
        </ElTableColumn>
      )
    }

    const renderTreeTableColumn = (columnsChildren: TableColumn[]): (VNode | null)[] =>
      columnsChildren.map((v) => (!v || v.hidden ? null : renderNormalColumn(v)))

    // 视频播放器在点击预览时才动态加载，不增加普通表格的初始负担
    const openVideoViewer = async (url: string) => {
      const { createVideoViewer } = await import('@/components/VideoPlayer')
      createVideoViewer({ url })
    }

    const renderPreview = (url: string, field: string) => {
      const { imagePreview = [], videoPreview = [] } = unref(getProps)
      return (
        <div class="flex items-center">
          {imagePreview.includes(field) ? (
            <ElImage
              src={url}
              fit="cover"
              class="w-[100%]"
              lazy
              preview-src-list={[url]}
              preview-teleported
            />
          ) : videoPreview.includes(field) ? (
            <ElButton type="primary" onClick={() => openVideoViewer(url)}>
              {{
                icon: () => <Icon icon="ep:video-play" />,
                default: () => '预览'
              }}
            </ElButton>
          ) : null}
        </div>
      )
    }

    // 多选列：布尔 selection 属性和源列中的 type=selection 共用
    const renderSelectionColumn = (v: TableColumn = { field: '', type: 'selection' }) => {
      const { reserveSelection, align, headerAlign } = unref(getProps)
      return (
        <ElTableColumn
          key={getColumnKey(v)}
          type="selection"
          reserveSelection={v.reserveSelection ?? reserveSelection}
          align={v.align || align}
          headerAlign={v.headerAlign || headerAlign}
          selectable={v.selectable}
          fixed={v.fixed}
          width={v.width ?? '50'}
        ></ElTableColumn>
      )
    }

    // 展开列：内容优先 column.slots.default，其次芋道原有的 expand 插槽
    const renderExpandColumn = (v: TableColumn = { field: '', type: 'expand' }) => {
      const { align, headerAlign } = unref(getProps)
      return (
        <ElTableColumn
          key={getColumnKey(v)}
          type="expand"
          align={v.align || align}
          headerAlign={v.headerAlign || headerAlign}
          fixed={v.fixed}
          width={v.width}
        >
          {{
            default: (data: TableSlotDefault) =>
              v.slots?.default ? v.slots.default(data) : getSlot(slots, 'expand', data)
          }}
        </ElTableColumn>
      )
    }

    // 序号列：index 为 0 也视为显式配置
    const renderIndexColumn = (v: TableColumn) => {
      const { reserveIndex, pageSize, currentPage, align, headerAlign } = unref(getProps)
      return (
        <ElTableColumn
          key={getColumnKey(v)}
          type="index"
          index={
            v.index !== undefined && v.index !== null
              ? v.index
              : (index: number) => setIndex(reserveIndex, index, pageSize, currentPage)
          }
          align={v.align || align}
          headerAlign={v.headerAlign || headerAlign}
          label={v.label}
          fixed={v.fixed}
          width={v.width ?? '65px'}
        ></ElTableColumn>
      )
    }

    const renderTableColumn = (columnsChildren?: TableColumn[]) => {
      const { selection, expand } = unref(getProps)
      const columns = columnsChildren || unref(renderedColumns)

      // 布尔 selection / expand 只在源列中没有同类型列时生成，避免重复
      const prefix: VNode[] = []
      if (!columnsChildren) {
        if (expand && !columns.some((v) => v?.type === 'expand')) {
          prefix.push(renderExpandColumn())
        }
        if (selection && !columns.some((v) => v?.type === 'selection')) {
          prefix.push(renderSelectionColumn())
        }
      }

      const list = columns.map((v) => {
        if (!v || v.hidden) return null
        if (v.type === 'index') return renderIndexColumn(v)
        if (v.type === 'selection') return renderSelectionColumn(v)
        if (v.type === 'expand') return renderExpandColumn(v)
        return renderNormalColumn(v)
      })
      return [...prefix, ...list]
    }

    return () => {
      // 只按插槽是否存在决定是否创建，避免为了判断而提前调用插槽
      const tableSlots: Recordable = {}
      if (slots.empty) {
        tableSlots['empty'] = (...args: any[]) => getSlot(slots, 'empty', args[0])
      }
      if (slots.append) {
        tableSlots['append'] = (...args: any[]) => getSlot(slots, 'append', args[0])
      }

      return (
        <div v-loading={unref(getProps).loading}>
          {unref(getProps).customContent ? (
            <div class="flex flex-wrap">
              {unref(getProps)?.data?.length ? (
                unref(getProps)?.data.map((item) => {
                  const cardSlots: Recordable = {
                    default: () => {
                      return getSlot(slots, 'content', item)
                    }
                  }
                  if (slots['content-header']) {
                    cardSlots['header'] = () => {
                      return getSlot(slots, 'content-header', item)
                    }
                  }
                  if (slots['content-footer']) {
                    cardSlots['footer'] = () => {
                      return getSlot(slots, 'content-footer', item)
                    }
                  }
                  return (
                    <ElCard
                      shadow="hover"
                      class={unref(getProps).cardWrapClass}
                      style={unref(getProps).cardWrapStyle}
                      bodyClass={unref(getProps).cardBodyClass}
                      bodyStyle={unref(getProps).cardBodyStyle}
                    >
                      {cardSlots}
                    </ElCard>
                  )
                })
              ) : (
                <div class="flex flex-1 justify-center">
                  <ElEmpty description="暂无数据" />
                </div>
              )}
            </div>
          ) : (
            <>
              {unref(getProps).showAction && !unref(getProps).customContent ? (
                <TableActions
                  columns={unref(renderedColumns)}
                  defaultColumns={unref(restoreColumns)}
                  onChangSize={changSize}
                  onRefresh={refresh}
                  onConfirm={confirmSetColumn}
                />
              ) : null}
              <ElTable
                ref={elTableRef}
                data={unref(getProps).data}
                {...getBindValue()}
                onSelection-change={selectionChange}
              >
                {{
                  default: () => renderTableColumn(),
                  ...tableSlots
                }}
              </ElTable>
            </>
          )}
          {unref(getProps).pagination ? (
            // update by 芋艿：保持和 Pagination 组件一致
            <ElPagination
              v-model:pageSize={pageSizeRef.value}
              v-model:currentPage={currentPageRef.value}
              class="float-right mb-15px mt-15px"
              {...unref(pagination)}
            ></ElPagination>
          ) : undefined}
        </div>
      )
    }
  }
})
</script>
<style lang="scss" scoped>
:deep(.el-button.is-text) {
  padding: 8px 4px;
  margin-left: 0;
}

:deep(.el-button.is-link) {
  padding: 8px 4px;
  margin-left: 0;
}
</style>
