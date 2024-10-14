import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import { TableColumn } from '@/types/table'
import * as MailAccountApi from '@/api/system/mail/account'

// 邮箱账号的列表
const accountList = await MailAccountApi.getSimpleMailAccountList()

// 表单校验
export const rules = reactive({
  name: [required],
  code: [required],
  accountId: [required],
  label: [required],
  content: [required],
  params: [required],
  status: [required]
})

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '模板编码',
    field: 'code',
    isSearch: true,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: '模板名称',
    field: 'name',
    isSearch: true,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: '模板标题',
    field: 'title'
  },
  {
    label: '模板内容',
    field: 'content',
    form: {
      component: 'Editor',
      componentProps: {
        valueHtml: '',
        height: 200
      }
    }
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    width: '200px',
    formatter: (_: Recordable, __: TableColumn, cellValue: number) => {
      return accountList.find((account) => account.id === cellValue)?.mail
    },
    search: {
      show: true,
      component: 'Select',
      api: () => accountList,
      componentProps: {
        optionsAlias: {
          labelField: 'mail',
          valueField: 'id'
        },
        style: {
          width: '240px'
        }
      }
    },
    form: {
      component: 'Select',
      api: () => accountList,
      componentProps: {
        optionsAlias: {
          labelField: 'mail',
          valueField: 'id'
        }
      }
    }
  },
  {
    label: '发送人名称',
    field: 'nickname'
  },
  {
    label: '开启状态',
    field: 'status',
    isSearch: true,
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: '备注',
    field: 'remark',
    isTable: false
  },
  {
    label: '创建时间',
    field: 'createTime',
    isForm: false,
    formatter: dateFormatter,
    search: {
      show: true,
      component: 'DatePicker',
      componentProps: {
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        type: 'daterange',
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
        style: {
          width: '240px'
        }
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
