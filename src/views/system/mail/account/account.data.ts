import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { DictTag } from '@/components/DictTag'
import { TableColumn } from '@/types/table'
import { dateFormatter } from '@/utils/formatTime'
import { getBoolDictOptions } from '@/utils/dict'

const { t } = useI18n() // 国际化

// 表单校验
export const rules = reactive({
  mail: [
    { required: true, message: t('profile.rules.mail'), trigger: 'blur' },
    {
      type: 'email',
      message: t('profile.rules.truemail'),
      trigger: ['blur', 'change']
    }
  ],
  username: [required],
  password: [required],
  host: [required],
  port: [required],
  sslEnable: [required]
})

// CrudSchema
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '邮箱',
    field: 'mail',
    isSearch: true
  },
  {
    label: '用户名',
    field: 'username',
    isSearch: true
  },
  {
    label: '密码',
    field: 'password',
    isTable: false
  },
  {
    label: 'SMTP 服务器域名',
    field: 'host'
  },
  {
    label: 'SMTP 服务器端口',
    field: 'port',
    form: {
      component: 'InputNumber',
      value: 465
    }
  },
  {
    label: '是否开启 SSL',
    field: 'sslEnable',
    formatter: (_: Recordable, __: TableColumn, cellValue: boolean) => {
      return h(DictTag, {
        type: DICT_TYPE.INFRA_BOOLEAN_STRING,
        value: cellValue
      })
    },
    form: {
      component: 'Radio',
      componentProps: {
        options: getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)
      }
    }
  },
  {
    label: '创建时间',
    field: 'createTime',
    isForm: false,
    formatter: dateFormatter
  },
  {
    label: '操作',
    field: 'action',
    form: {
      show: false
    }
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
