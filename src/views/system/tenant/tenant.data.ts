import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'
import { getTenantPackageList, TenantPackageVO } from '@/api/system/tenantPackage'
import { ComponentOptions } from '@/types/components'

const { t } = useI18n() // 国际化

export const tenantPackageOption: ComponentOptions[] = []
const getTenantPackageOptions = async () => {
  const res = await getTenantPackageList()
  res.forEach((tenantPackage: TenantPackageVO) => {
    tenantPackageOption.push({
      key: tenantPackage.id,
      value: tenantPackage.id,
      label: tenantPackage.name
    })
  })

  return tenantPackageOption
}
getTenantPackageOptions()

const validateName = (rule: any, value: any, callback: any) => {
  const reg = /^[a-zA-Z0-9]{4,30}$/
  if (value === '') {
    callback(new Error('请输入用户名称'))
  } else {
    console.log(reg.test(rule), 'reg.test(rule)')
    if (!reg.test(value)) {
      callback(new Error('用户名称由 数字、字母 组成'))
    } else {
      callback()
    }
  }
}
const validateMobile = (rule: any, value: any, callback: any) => {
  const reg = /^1(3[0-9]|4[01456879]|5[0-35-9]|6[2567]|7[0-8]|8[0-9]|9[0-35-9])\d{8}$/
  if (value === '') {
    callback(new Error('请输入联系手机'))
  } else {
    if (!reg.test(value)) {
      callback(new Error('请输入正确的手机号'))
    } else {
      callback()
    }
  }
}

// 表单校验
export const rules = reactive({
  name: [required],
  packageId: [required],
  contactName: [required],
  contactMobile: [
    required,
    {
      validator: validateMobile,
      trigger: 'blur'
    }
  ],
  accountCount: [required],
  expireTime: [required],
  username: [
    required,
    {
      min: 4,
      max: 30,
      trigger: 'blur',
      message: '用户名称长度为 4-30 个字符'
    },
    { validator: validateName, trigger: 'blur' }
  ],
  password: [
    required,
    {
      min: 4,
      max: 16,
      trigger: 'blur',
      message: '密码长度为 4-16 位'
    }
  ],
  domain: [required],
  status: [required]
})

// CrudSchema.
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryTitle: '租户编号',
  primaryType: 'id',
  action: true,
  columns: [
    {
      title: '租户名称',
      field: 'name',
      isSearch: true
    },
    {
      title: '租户套餐',
      field: 'packageId',
      table: {
        slots: {
          default: 'packageId_default'
        }
      },
      form: {
        component: 'Select',
        componentProps: {
          options: tenantPackageOption
        }
      }
    },
    {
      title: '联系人',
      field: 'contactName',
      isSearch: true
    },
    {
      title: '联系手机',
      field: 'contactMobile',
      isSearch: true
    },
    {
      title: '用户名称',
      field: 'username',
      isTable: false,
      isDetail: false
    },
    {
      title: '用户密码',
      field: 'password',
      isTable: false,
      isDetail: false,
      form: {
        component: 'InputPassword'
      }
    },
    {
      title: '账号额度',
      field: 'accountCount',
      table: {
        slots: {
          default: 'accountCount_default'
        }
      },
      form: {
        component: 'InputNumber'
      }
    },
    {
      title: '过期时间',
      field: 'expireTime',
      formatter: 'formatDate',
      form: {
        component: 'DatePicker',
        componentProps: {
          type: 'datetime',
          valueFormat: 'x'
        }
      }
    },
    {
      title: '绑定域名',
      field: 'domain'
    },
    {
      title: '租户状态',
      field: 'status',
      dictType: DICT_TYPE.COMMON_STATUS,
      dictClass: 'number',
      isSearch: true
    },
    {
      title: t('table.createTime'),
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
