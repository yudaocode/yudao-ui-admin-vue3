import type { VxeCrudSchema } from '@/hooks/web/useVxeCrudSchemas'
// 国际化
const { t } = useI18n()
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
  username: [required],
  nickname: [required],
  password: [required],
  deptId: [required],
  email: [
    { required: true, message: t('profile.rules.mail'), trigger: 'blur' },
    {
      type: 'email',
      message: t('profile.rules.truemail'),
      trigger: ['blur', 'change']
    }
  ],
  status: [required],
  mobile: [
    required,
    {
      len: 11,
      trigger: 'blur',
      message: '请输入正确的手机号码'
    },
    { validator: validateMobile, trigger: 'blur' }
  ]
})
// crudSchemas
const crudSchemas = reactive<VxeCrudSchema>({
  primaryKey: 'id',
  primaryType: 'id',
  primaryTitle: '用户编号',
  action: true,
  actionWidth: '200px',
  columns: [
    {
      title: '用户账号',
      field: 'username',
      isSearch: true
    },
    {
      title: '用户密码',
      field: 'password',
      isDetail: false,
      isTable: false,
      form: {
        component: 'InputPassword'
      }
    },
    {
      title: '用户' + t('profile.user.sex'),
      field: 'sex',
      dictType: DICT_TYPE.SYSTEM_USER_SEX,
      dictClass: 'number',
      table: { show: false }
    },
    {
      title: '用户昵称',
      field: 'nickname'
    },
    {
      title: '用户邮箱',
      field: 'email'
    },
    {
      title: '手机号码',
      field: 'mobile',
      isSearch: true
    },
    {
      title: '部门',
      field: 'deptId',
      isTable: false
    },
    {
      title: '岗位',
      field: 'postIds',
      isTable: false
    },
    {
      title: t('common.status'),
      field: 'status',
      dictType: DICT_TYPE.COMMON_STATUS,
      dictClass: 'number',
      isSearch: true,
      table: {
        slots: {
          default: 'status_default'
        }
      }
    },
    {
      title: '最后登录时间',
      field: 'loginDate',
      formatter: 'formatDate',
      isForm: false
    },
    {
      title: '最后登录IP',
      field: 'loginIp',
      isTable: false,
      isForm: false
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
      isTable: false,
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
