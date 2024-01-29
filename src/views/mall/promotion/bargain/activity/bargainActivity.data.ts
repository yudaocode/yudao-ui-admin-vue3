import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter2 } from '@/utils/formatTime'

// 表单校验
export const rules = reactive({
  name: [required],
  startTime: [required],
  endTime: [required],
  helpMaxCount: [required],
  bargainCount: [required],
  singleLimitCount: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '砍价活动名称',
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
    label: '砍价人数',
    field: 'helpMaxCount',
    isSearch: false,
    form: {
      component: 'InputNumber',
      labelMessage: '参与人数不能少于两人',
      value: 2
    }
  },
  {
    label: '最大帮砍次数',
    field: 'bargainCount',
    isSearch: false,
    form: {
      component: 'InputNumber',
      labelMessage: '参与人数不能少于两人',
      value: 2
    }
  },
  {
    label: '总限购数量',
    field: 'totalLimitCount',
    isSearch: false,
    form: {
      component: 'InputNumber',
      labelMessage: '用户最大能发起砍价的次数',
      value: 0
    }
  },
  {
    label: '砍价的最小金额',
    field: 'randomMinPrice',
    isSearch: false,
    isTable: false,
    form: {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.1
      },
      labelMessage: '用户每次砍价的最小金额',
      value: 0
    }
  },
  {
    label: '砍价的最大金额',
    field: 'randomMaxPrice',
    isSearch: false,
    isTable: false,
    form: {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.1
      },
      labelMessage: '用户每次砍价的最大金额',
      value: 0
    }
  },
  {
    label: '砍价商品',
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
