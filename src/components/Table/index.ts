import Table from './src/Table.vue'
import { ElTable } from 'element-plus'
import type { TableColumn, TableSetProps } from './src/types'
import TableSelectForm from './src/TableSelectForm.vue'

export type {
  ColumnFixed,
  Pagination,
  TableColumn,
  TableProps,
  TableSetProps,
  TableSetPropsType,
  TableSlotDefault
} from './src/types'

export interface TableExpose {
  setProps: (props: Recordable) => void
  setColumn: (columnProps: TableSetProps[], columnsChildren?: TableColumn[]) => void
  addColumn: (column: TableColumn, index?: number) => void
  delColumn: (field: string) => void
  selections: Recordable[]
  elTableRef: ComponentRef<typeof ElTable>
}

export { Table, TableSelectForm }
