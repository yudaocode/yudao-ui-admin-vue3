import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'

// 表单校验
export const rules = reactive({
  name: [required],
  startTime: [required],
  endTime: [required],
  picUrl: [required],
  status: [required]
})

// CrudSchema https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '秒杀时段名称',
    field: 'name',
    isSearch: true
  },
  {
    label: '开始时间点',
    field: 'startTime',
    isSearch: false,
    search: {
      component: 'TimePicker'
    },
    form: {
      component: 'TimePicker',
      componentProps: {
        valueFormat: 'HH:mm:ss'
      }
    }
  },
  {
    label: '结束时间点',
    field: 'endTime',
    isSearch: false,
    search: {
      component: 'TimePicker'
    },
    form: {
      component: 'TimePicker',
      componentProps: {
        valueFormat: 'HH:mm:ss'
      }
    }
  },
  {
    label: '秒杀轮播图',
    field: 'sliderPicUrls',
    isSearch: false,
    form: {
      component: 'UploadImgs'
    },
    table: {
      width: 300
    }
  },
  {
    label: '状态',
    field: 'status',
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    isSearch: true,
    form: {
      component: 'Radio'
    }
  },
  {
    label: '创建时间',
    field: 'createTime',
    isForm: false,
    isSearch: false,
    formatter: dateFormatter
  },
  {
    label: '操作',
    field: 'action',
    isForm: false
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
