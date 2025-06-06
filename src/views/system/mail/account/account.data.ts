import type { CrudSchema } from '@/hooks/web/useCrudSchemas'
import { dateFormatter } from '@/utils/formatTime'
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
  sslEnable: [required],
  starttlsEnable: [required]
})

// CrudSchema：https://doc.iocoder.cn/vue3/crud-schema/
const crudSchemas = reactive<CrudSchema[]>([
  {
    label: '邮箱',
    field: 'mail',
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
    label: '用户名',
    field: 'username',
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
    dictType: DICT_TYPE.INFRA_BOOLEAN_STRING,
    dictClass: 'boolean',
    form: {
      component: 'Radio'
    }
  },
  {
    label: '是否开启 STARTTLS',
    field: 'starttlsEnable',
    dictType: DICT_TYPE.INFRA_BOOLEAN_STRING,
    dictClass: 'boolean',
    form: {
      component: 'Radio'
    }
  },
  {
    label: '创建时间',
    field: 'createTime',
    isForm: false,
    formatter: dateFormatter,
    detail: {
      dateFormat: 'YYYY-MM-DD HH:mm:ss'
    }
  },
  {
    label: '操作',
    field: 'action',
    isForm: false,
    isDetail: false
  }
])
export const { allSchemas } = useCrudSchemas(crudSchemas)
