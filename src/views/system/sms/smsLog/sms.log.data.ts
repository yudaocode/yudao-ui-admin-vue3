import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'

const { t } = useI18n() // 国际化

const authorizedGrantOptions = getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)
// CrudSchema
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryType: 'id',
  primaryTitle: '日志编号',
  action: true,
  columns: [
    {
      title: '手机号',
      field: 'mobile',
      isSearch: true
    },
    {
      title: '短信内容',
      field: 'templateContent'
    },
    {
      title: '模板编号',
      field: 'templateId',
      isSearch: true
    },
    {
      title: '短信渠道',
      field: 'channelId',
      // dictType: DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE,
      // dictClass: 'number',
      isSearch: true,
      // table: {
      // component: 'Select',
      componentProps: {
        options: authorizedGrantOptions
        // multiple: false,
        // filterable: true
      }
      // }
    },
    {
      title: '发送状态',
      field: 'sendStatus',
      dictType: DICT_TYPE.SYSTEM_SMS_SEND_STATUS,
      dictClass: 'number',
      isSearch: true
    },
    {
      title: '发送时间',
      field: 'sendTime',
      formatter: 'formatDate',
      search: {
        show: true,
        itemRender: {
          name: 'XDataTimePicker'
        }
      }
    },
    {
      title: '短信类型',
      field: 'templateType',
      dictType: DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE,
      dictClass: 'number',
      isSearch: true
    },
    {
      title: '接收状态',
      field: 'receiveStatus',
      dictType: DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS,
      dictClass: 'number',
      isSearch: true
    },
    {
      title: '接收时间',
      field: 'receiveTime',
      formatter: 'formatDate',
      search: {
        show: true,
        itemRender: {
          name: 'XDataTimePicker'
        }
      }
    },
    {
      title: t('common.createTime'),
      field: 'createTime',
      formatter: 'formatDate'
    }
  ]
})
export const { allSchemas } = useVxeCrudSchemas(crudSchemas)
