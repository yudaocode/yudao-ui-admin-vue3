<template>
  <Dialog :title="modelTitle" v-model="modelVisible" width="50%">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="租户名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入租户名" />
      </el-form-item>
      <el-form-item label="租户套餐" prop="packageId">
        <el-select v-model="formData.packageId" placeholder="请选择租户套餐" clearable>
          <el-option
            v-for="item in packageList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="联系人" prop="contactName">
        <el-input v-model="formData.contactName" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系手机" prop="contactMobile">
        <el-input v-model="formData.contactMobile" placeholder="请输入联系手机" />
      </el-form-item>
      <el-form-item v-if="formData.id === undefined" label="用户名称" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名称" />
      </el-form-item>
      <el-form-item v-if="formData.id === undefined" label="用户密码" prop="password">
        <el-input
          v-model="formData.password"
          placeholder="请输入用户密码"
          type="password"
          show-password
        />
      </el-form-item>
      <el-form-item label="账号额度" prop="accountCount">
        <el-input-number
          v-model="formData.accountCount"
          placeholder="请输入账号额度"
          controls-position="right"
          :min="0"
        />
      </el-form-item>
      <el-form-item label="过期时间" prop="expireTime">
        <el-date-picker
          clearable
          v-model="formData.expireTime"
          type="date"
          value-format="x"
          placeholder="请选择过期时间"
        />
      </el-form-item>
      <el-form-item label="绑定域名" prop="domain">
        <el-input v-model="formData.domain" placeholder="请输入绑定域名" />
      </el-form-item>
      <el-form-item label="租户状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="modelVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as TenantApi from '@/api/system/tenant'
import { CommonStatusEnum } from '@/utils/constants'
import * as TenantPackageApi from '@/api/system/tenantPackage'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  packageId: undefined,
  contactName: undefined,
  contactMobile: undefined,
  accountCount: undefined,
  expireTime: undefined,
  domain: undefined,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  name: [{ required: true, message: '租户名不能为空', trigger: 'blur' }],
  packageId: [{ required: true, message: '租户套餐不能为空', trigger: 'blur' }],
  contactName: [{ required: true, message: '联系人不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '租户状态不能为空', trigger: 'blur' }],
  accountCount: [{ required: true, message: '账号额度不能为空', trigger: 'blur' }],
  expireTime: [{ required: true, message: '过期时间不能为空', trigger: 'blur' }],
  domain: [{ required: true, message: '绑定域名不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const packageList = ref([]) // 租户套餐

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await TenantApi.getTenant(id)
    } finally {
      formLoading.value = false
    }
  }
  // 加载套餐列表
  packageList.value = await TenantPackageApi.getTenantPackageList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as TenantApi.TenantVO
    if (formType.value === 'create') {
      await TenantApi.createTenant(data)
      message.success(t('common.createSuccess'))
    } else {
      await TenantApi.updateTenant(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    packageId: undefined,
    contactName: undefined,
    contactMobile: undefined,
    accountCount: undefined,
    expireTime: undefined,
    domain: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
