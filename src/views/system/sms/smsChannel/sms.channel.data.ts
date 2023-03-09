import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'

const { t } = useI18n() // 国际化

const authorizedGrantOptions = getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)

// 表单校验
export const rules = reactive({
  signature: [required],
  code: [required],
  apiKey: [required],
  status: [required]
})

// CrudSchema
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryType: 'id',
  primaryTitle: '渠道编号',
  action: true,
  columns: [
    {
      title: '短信签名',
      field: 'signature',
      isSearch: true
    },
    {
      title: '渠道编码',
      field: 'code',
      // dictType: DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE,
      // dictClass: 'string',
      isSearch: true,
      form: {
        component: 'Select',
        componentProps: {
          options: authorizedGrantOptions,
          multiple: false,
          filterable: true
        }
      }
    },
    {
      title: t('common.status'),
      field: 'status',
      dictType: DICT_TYPE.COMMON_STATUS,
      dictClass: 'number',
      isSearch: true
    },
    {
      title: '短信 API 的账号',
      field: 'apiKey'
    },
    {
      title: '短信 API 的密钥',
      field: 'apiSecret'
    },
    {
      title: '短信发送回调 URL',
      field: 'callbackUrl'
    },
    {
      title: t('common.createTime'),
      field: 'createTime',
      formatter: 'formatDate',
      isForm: false,
      search: {
        show: true,
        itemRender: {
          name: 'XDataTimePicker'
        }
      }
    }
  ]
})
export const { allSchemas } = useVxeCrudSchemas(crudSchemas)
