/**
 * element-plus/es 类型入口兼容：ElTableColumn 缺省行类型为 any；ElTable 可直接绑定原始值数组（当前仅用于类型解析）
 *
 * element-plus 2.14 的 ElTableColumn 为 <T extends DefaultRow = DefaultRow> 泛型组件，未显式泛型的列
 * 插槽 row 为 DefaultRow，不能直接传给业务 VO 参数。这里由 typeof ElTableColumn<T> 派生出同一调用签名，
 * Props / Slots 均来自 element-plus 自身，只把缺省 T 改为 any；静态成员（install 等）保留，
 * 其余具名导出与默认导出原样转出。
 *
 * ElTable 的 data 受 T extends DefaultRow 约束，string[] 等原始值数组无法直接绑定。这里在 element-plus 原泛型签名
 * （保持第一位，对象行推断与显式泛型不变）之后追加一个非泛型签名：仅当 data 为 string / number 数组时匹配，
 * 其余属性仍按 element-plus 定义校验。
 *
 * 已验证范围：
 * - 未显式泛型的列：插槽 row / column 与函数型列属性的行参数放宽为 any
 * - <!-- @vue-generic {VO} --> 显式泛型仍按 VO 校验字段与参数；组件属性与普通 API 参数检查不变
 * - 列上已指定 VO 参数的 formatter 时，T 仍可推断；更复杂的泛型推断情形不作保证
 * - ElTable 原始值签名为新增，待验证：对象表格属性错误在两个签名都不匹配时报 TS2769（No overload matches）
 *
 * 维护注意：
 * - 由 tsconfig.json paths 精确映射 'element-plus/es'，auto-components.d.ts 经此声明模板组件；
 *   显式 import 'element-plus' 根入口与深路径不经过本文件，保持 element-plus 原类型
 * - 当前仅用于类型解析：Vite 未开启 resolve.tsconfigPaths，运行时仍解析真实 element-plus/es；
 *   未来若启用 tsconfigPaths，须重新验证运行时导入与打包影响
 * - 升级 element-plus 后需复核本文件无类型错误，并确认显式泛型与默认列行为不变
 */
import type { ElTable as EpElTable, ElTableColumn as EpElTableColumn } from 'element-plus'

export * from 'element-plus'
export { default } from 'element-plus'

/** 与 element-plus 内部 DefaultRow 相同的约束 */
type TableRow = Record<PropertyKey, any>

/** element-plus 原始列组件按行类型 T 实例化后的类型 */
type EpTableColumn<T extends TableRow> = typeof EpElTableColumn<T>

/** 原始列组件的静态成员（install 等），不含调用签名 */
type EpTableColumnStatics = Pick<typeof EpElTableColumn, keyof typeof EpElTableColumn>

/** 与原始列组件相同的泛型调用签名，仅缺省行类型为 any */
type TableColumnWithAnyDefaultRow = <T extends TableRow = any>(
  props: Parameters<EpTableColumn<T>>[0],
  ctx?: Parameters<EpTableColumn<T>>[1],
  exposed?: Parameters<EpTableColumn<T>>[2],
  setup?: Parameters<EpTableColumn<T>>[3]
) => ReturnType<EpTableColumn<T>>

export declare const ElTableColumn: TableColumnWithAnyDefaultRow & EpTableColumnStatics

/** 表格可直接绑定的原始值行类型（如 string[] 列表） */
type TablePrimitiveRow = string | number

/** element-plus 原始表格按对象行实例化后的类型 */
type EpTableWithObjectRow = typeof EpElTable<TableRow>

/** element-plus 原始表格属性 */
type EpTableProps = Parameters<EpTableWithObjectRow>[0]

/** 去掉 data 的表格属性：键重映射保留已知属性，避免被 vue-tsc 属性兜底的索引签名吞掉 */
type TablePropsWithoutData = {
  [K in keyof EpTableProps as K extends 'data' ? never : K]: EpTableProps[K]
}

/** 原始值数据的追加调用签名：仅 data 为 string / number 数组时匹配 */
type TableWithPrimitiveData = (
  props: TablePropsWithoutData & { data: TablePrimitiveRow[] },
  ctx?: Parameters<EpTableWithObjectRow>[1],
  exposed?: Parameters<EpTableWithObjectRow>[2],
  setup?: Parameters<EpTableWithObjectRow>[3]
) => ReturnType<EpTableWithObjectRow>

export declare const ElTable: typeof EpElTable & TableWithPrimitiveData
