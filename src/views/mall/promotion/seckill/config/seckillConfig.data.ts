import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'

// 表单校验
export const rules = reactive({
  name: [required],
  startTime: [required],
  endTime: [required],
  seckillActivityCount: [required],
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
    label: '秒杀主图',
    field: 'picUrl',
    isSearch: false,
    form: {
      component: 'UploadImg'
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

/**
 *  添加这个函数呢是因为数据库表使用 time 类型存的时分秒信息，对应实体类字段使用的 LocalTime，然后返回给前端的就数据是
 *  '00:05:00' 会变成 [0,5],所以才使用此方法转一道。我想着或许直接后台返回字符串格式的
 * @param data
 */
export const format = (data: number[]): string => {
  if (typeof data === 'undefined') {
    return ''
  }
  const paddedData = data.length >= 3 ? data.slice(0, 3) : [...data, 0, 0].slice(0, 3)
  return paddedData.map((num) => num.toString().padStart(2, '0')).join(':')
}
