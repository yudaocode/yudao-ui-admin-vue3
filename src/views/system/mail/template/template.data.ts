import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import { TableColumn } from '@/types/table'
import { DictTag } from '@/components/DictTag'
import * as MailAccountApi from '@/api/system/mail/account'

const accounts = await MailAccountApi.getSimpleMailAccountList()

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

// CrudSchema：https://kailong110120130.gitee.io/vue-element-plus-admin-doc/hooks/useCrudSchemas.html
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '模板编码',
    field: 'code',
    isSearch: true
  },
  {
    label: '模板名称',
    field: 'name',
    isSearch: true
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
      colProps: {
        span: 24
      },
      componentProps: {
        valueHtml: ''
      }
    }
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    isSearch: true,
    width: '200px',
    formatter: (_: Recordable, __: TableColumn, cellValue: number) => {
      return accounts.find((account) => account.id === cellValue)?.mail
    },
    search: {
      show: true,
      component: 'Select',
      api: () => {
        return accounts
      },
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
    formatter: (_: Recordable, __: TableColumn, cellValue: number) => {
      return h(DictTag, {
        type: DICT_TYPE.COMMON_STATUS,
        value: cellValue
      })
    },
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number'
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
        defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')]
      }
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
