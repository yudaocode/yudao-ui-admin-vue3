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
  limitDuration: [required],
  virtualGroup: [required]
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
    label: '虚拟成团',
    field: 'virtualGroup',
    dictType: DICT_TYPE.INFRA_BOOLEAN_STRING,
    dictClass: 'boolean',
    isSearch: true,
    form: {
      component: 'Radio',
      value: false
    }
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
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
