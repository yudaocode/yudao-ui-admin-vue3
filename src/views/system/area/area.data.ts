import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'

// CrudSchema
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryType: null,
  action: false,
  columns: [
    {
      title: '编号',
      field: 'id',
      table: {
        treeNode: true,
        align: 'left'
      }
    },
    {
      title: '名字',
      field: 'name'
    }
  ]
})
export const { allSchemas } = useVxeCrudSchemas(crudSchemas)
