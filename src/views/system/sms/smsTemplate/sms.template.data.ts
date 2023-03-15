import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'
import * as smsApi from '@/api/system/sms/smsChannel'
const { t } = useI18n() // 国际化
const tenantPackageOption = []
const getTenantPackageOptions = async () => {
  const res = await smsApi.getSimpleSmsChannels()
  console.log(res, 'resresres')
  res.forEach((tenantPackage: TenantPackageVO) => {
    tenantPackageOption.push({
      key: tenantPackage.id,
      value: tenantPackage.id,
      label: tenantPackage.signature
    })
  })
}
getTenantPackageOptions()
// 表单校验
export const rules = reactive({
  type: [required],
  status: [required],
  code: [required],
  name: [required],
  content: [required],
  apiTemplateId: [required],
  channelId: [required]
})

// CrudSchema
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryType: 'id',
  primaryTitle: '模板编号',
  action: true,
  actionWidth: '280',
  columns: [
    {
      title: '短信渠道编码',
      field: 'channelId',
      isSearch: false,
      isForm: true,
      isTable: false,
      form: {
        component: 'Select',
        componentProps: {
          options: tenantPackageOption
        }
      }
    },
    {
      title: '模板编码',
      field: 'code',
      isSearch: true
    },
    {
      title: '模板名称',
      field: 'name',
      isSearch: true
    },
    {
      title: '模板内容',
      field: 'content'
    },
    {
      title: '短信 API 的模板编号',
      field: 'apiTemplateId',
      isSearch: true
    },
    {
      title: '短信类型',
      field: 'type',
      dictType: DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE,
      dictClass: 'number',
      isSearch: true,
      table: {
        width: 80
      }
    },
    {
      title: t('common.status'),
      field: 'status',
      dictType: DICT_TYPE.COMMON_STATUS,
      dictClass: 'number',
      isSearch: true,
      table: {
        width: 80
      }
    },
    {
      title: t('form.remark'),
      field: 'remark',
      isTable: false
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
