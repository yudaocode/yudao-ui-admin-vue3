import type { CrudSchema } from '@/hooks/web/useCrudSchemas'

// 表单校验
export const rules = reactive({
  spuId: [required],
  sort: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '排序',
    field: 'sort',
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 80
    }
  },
  {
    label: '积分商城活动商品',
    field: 'spuId',
    isTable: true,
    isSearch: false,
    form: {
      colProps: {
        span: 24
      }
    },
    table: {
      width: 300
    }
  },
  {
    label: '备注',
    field: 'remark',
    isSearch: false,
    form: {
      component: 'Input',
      componentProps: {
        type: 'textarea',
        rows: 4
      },
      colProps: {
        span: 24
      }
    },
    table: {
      width: 300
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
