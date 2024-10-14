import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
import * as MailAccountApi from '@/api/system/mail/account'

// 邮箱账号的列表
const accountList = await MailAccountApi.getSimpleMailAccountList()

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '编号',
    field: 'id'
  },
  {
    label: '发送时间',
    field: 'sendTime',
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
    },
    detail: {
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  {
    label: '接收邮箱',
    field: 'toMail'
  },
  {
    label: '用户编号',
    field: 'userId',
    isSearch: true,
    isTable: false,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: '用户类型',
    field: 'userType',
    dictType: DICT_TYPE.USER_TYPE,
    dictClass: 'number',
    isSearch: true,
    isTable: false,
    search: {
      componentProps: {
        style: {
          width: '240px'
        }
      }
    }
  },
  {
    label: '邮件标题',
    field: 'templateTitle'
  },
  {
    label: '邮件内容',
    field: 'templateContent',
    isTable: false
  },
  {
    label: '邮箱参数',
    field: 'templateParams',
    isTable: false
  },
  {
    label: '发送状态',
    field: 'sendStatus',
    dictType: DICT_TYPE.SYSTEM_MAIL_SEND_STATUS,
    dictClass: 'string',
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
    label: '邮箱账号',
    field: 'accountId',
    isTable: false,
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
    }
  },
  {
    label: '发送邮箱地址',
    field: 'fromMail',
    table: {
      label: '邮箱账号'
    }
  },
  {
    label: '模板编号',
    field: 'templateId',
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
    label: '模板编码',
    field: 'templateCode',
    isTable: false
  },
  {
    label: '模版发送人名称',
    field: 'templateNickname',
    isTable: false
  },
  {
    label: '发送返回的消息编号',
    field: 'sendMessageId',
    isTable: false
  },
  {
    label: '发送异常',
    field: 'sendException',
    isTable: false
  },
  {
    label: '创建时间',
    field: 'createTime',
    isTable: false,
    formatter: dateFormatter,
    detail: {
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  {
    label: '操作',
    field: 'action',
    isDetail: false
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
