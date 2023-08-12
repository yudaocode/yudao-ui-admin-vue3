import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import { getSimpleSeckillConfigList } from '@/api/mall/promotion/seckill/seckillConfig'

// 表单校验
export const rules = reactive({
  spuId: [required],
  name: [required],
  startTime: [required],
  endTime: [required],
  sort: [required],
  configIds: [required],
  totalLimitCount: [required],
  singleLimitCount: [required],
  totalStock: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '秒杀活动名称',
    field: 'name',
    isSearch: true,
    form: {
      colProps: {
        span: 24
      }
    },
    table: {
      width: 120
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
    label: '秒杀时段',
    field: 'configIds',
    form: {
      component: 'Select',
      componentProps: {
        multiple: true,
        optionsAlias: {
          labelField: 'name',
          valueField: 'id'
        }
      },
      api: getSimpleSeckillConfigList
    },
    table: {
      width: 300
    }
  },
  {
    label: '新增订单数',
    field: 'orderCount',
    isForm: false,
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
  {
    label: '付款人数',
    field: 'userCount',
    isForm: false,
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
  {
    label: '订单实付金额',
    field: 'totalPrice',
    isForm: false,
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
  {
    label: '总限购数量',
    field: 'totalLimitCount',
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
  {
    label: '单次限够数量',
    field: 'singleLimitCount',
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
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
    label: '秒杀库存',
    field: 'stock',
    isForm: false,
    form: {
      component: 'InputNumber',
      value: 0
    },
    table: {
      width: 120
    }
  },
  {
    label: '秒杀总库存',
    field: 'totalStock',
    isForm: false,
    table: {
      width: 120
    }
  },
  {
    label: '秒杀活动商品',
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
    label: '创建时间',
    field: 'createTime',
    formatter: dateFormatter,
    search: {
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        type: 'daterange',
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')]
      }
    },
    isForm: false,
    table: {
      width: 120
    }
  },
  {
    label: '状态',
    field: 'status',
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    isForm: false,
    isSearch: true,
    form: {
      component: 'Radio'
    },
    table: {
      width: 80
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
  },
  {
    label: '操作',
    field: 'action',
    isForm: false,
    table: {
      width: 120,
      fixed: 'right'
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
