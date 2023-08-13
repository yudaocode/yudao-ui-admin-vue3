import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter2 } from '@/utils/formatTime'

// 表单校验
export const rules = reactive({
  name: [required],
  totalLimitCount: [required],
  singleLimitCount: [required],
  startTime: [required],
  endTime: [required],
  userSize: [required],
  limitDuration: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '拼团名称',
    field: 'name',
    isSearch: true,
    isTable: false,
    form: {
      colProps: {
        span: 24
      }
    }
  },
  {
    label: '活动开始时间',
    field: 'startTime',
    formatter: dateFormatter2,
    isSearch: true,
    search: {
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'YYYY-MM-DD',
        type: 'daterange'
      }
    },
    form: {
      component: 'DatePicker',
      componentProps: {
        type: 'date',
        valueFormat: 'x'
      }
    },
    table: {
      width: 120
    }
  },
  {
    label: '活动结束时间',
    field: 'endTime',
    formatter: dateFormatter2,
    isSearch: true,
    search: {
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'YYYY-MM-DD',
        type: 'daterange'
      }
    },
    form: {
      component: 'DatePicker',
      componentProps: {
        type: 'date',
        valueFormat: 'x'
      }
    },
    table: {
      width: 120
    }
  },
  {
    label: '参与人数',
    field: 'userSize',
    isSearch: false,
    form: {
      component: 'InputNumber',
      labelMessage: '参与人数不能少于两人',
      value: 2
    }
  },
  {
    label: '限制时长',
    field: 'limitDuration',
    isSearch: false,
    isTable: false,
    form: {
      component: 'InputNumber',
      labelMessage: '限制时长(小时)',
      componentProps: {
        placeholder: '请输入限制时长(小时)'
      }
    }
  },
  {
    label: '总限购数量',
    field: 'totalLimitCount',
    isSearch: false,
    isTable: false,
    form: {
      component: 'InputNumber',
      value: 0
    }
  },
  {
    label: '单次限购数量',
    field: 'singleLimitCount',
    isSearch: false,
    isTable: false,
    form: {
      component: 'InputNumber',
      value: 0
    }
  },
  {
    label: '购买人数',
    field: 'userSize',
    isSearch: false,
    isForm: false
  },
  {
    label: '开团组数',
    field: 'totalCount',
    isSearch: false,
    isForm: false
  },
  {
    label: '成团组数',
    field: 'successCount',
    isSearch: false,
    isForm: false
  },
  {
    label: '活动状态',
    field: 'status',
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    isSearch: true,
    isForm: false
  },
  {
    label: '拼团商品',
    field: 'spuId',
    isSearch: false,
    form: {
      colProps: {
        span: 24
      }
    }
  },
  {
    label: '操作',
    field: 'action',
    isForm: false
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
