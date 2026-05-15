<!-- WMS 往来企业表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1000px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="往来企业编号" prop="code">
            <el-input v-model="formData.code" maxlength="20" placeholder="请输入往来企业编号">
              <template #append>
                <el-button @click="formData.code = generateWmsCode('M')">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="往来企业名称" prop="name">
            <el-input v-model="formData.name" maxlength="60" placeholder="请输入往来企业名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="往来企业类型" prop="type">
            <el-select v-model="formData.type" class="w-1/1" placeholder="请选择往来企业类型">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.WMS_MERCHANT_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="级别" prop="level">
            <el-input v-model="formData.level" maxlength="10" placeholder="请输入级别" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户行" prop="bankName">
            <el-input v-model="formData.bankName" maxlength="255" placeholder="请输入开户行" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行账户" prop="bankAccount">
            <el-input v-model="formData.bankAccount" maxlength="40" placeholder="请输入银行账户" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地址" prop="address">
            <el-input v-model="formData.address" maxlength="200" placeholder="请输入地址" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact">
            <el-input v-model="formData.contact" maxlength="30" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="formData.mobile" maxlength="13" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="座机号" prop="telephone">
            <el-input v-model="formData.telephone" maxlength="13" placeholder="请输入座机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Email" prop="email">
            <el-input v-model="formData.email" maxlength="50" placeholder="请输入 Email" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" maxlength="255" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MerchantApi, MerchantVO } from '@/api/wms/md/merchant'
import { generateWmsCode } from '@/views/wms/utils/constants'

/** WMS 往来企业表单 */
defineOptions({ name: 'WmsMerchantForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<MerchantVO>({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  level: undefined,
  bankName: undefined,
  bankAccount: undefined,
  address: undefined,
  mobile: undefined,
  telephone: undefined,
  contact: undefined,
  email: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '往来企业编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '往来企业名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '往来企业类型不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MerchantApi.getMerchant(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as MerchantVO
    if (formType.value === 'create') {
      await MerchantApi.createMerchant(data)
      message.success(t('common.createSuccess'))
    } else {
      await MerchantApi.updateMerchant(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
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
    code: undefined,
    name: undefined,
    type: undefined,
    level: undefined,
    bankName: undefined,
    bankAccount: undefined,
    address: undefined,
    mobile: undefined,
    telephone: undefined,
    contact: undefined,
    email: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
