<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入客户编码">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入客户名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="客户简称" prop="nickname">
            <el-input v-model="formData.nickname" placeholder="请输入客户简称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户英文名称" prop="englishName">
            <el-input v-model="formData.englishName" placeholder="请输入客户英文名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择客户类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CLIENT_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="客户简介" prop="description">
            <el-input v-model="formData.description" type="textarea" placeholder="请输入客户简介" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="客户地址" prop="address">
            <el-input v-model="formData.address" type="textarea" placeholder="请输入客户地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户官网地址" prop="website">
            <el-input v-model="formData.website" placeholder="请输入客户官网地址" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户邮箱地址" prop="email">
            <el-input v-model="formData.email" placeholder="请输入客户邮箱地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户电话" prop="telephone">
            <el-input v-model="formData.telephone" placeholder="请输入客户电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户LOGO" prop="logo">
            <el-input v-model="formData.logo" placeholder="请输入客户LOGO地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="联系人1" prop="contact1Name">
            <el-input v-model="formData.contact1Name" placeholder="请输入联系人1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系人1-电话" prop="contact1Telephone">
            <el-input v-model="formData.contact1Telephone" placeholder="请输入联系人1电话" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系人1-邮箱" prop="contact1Email">
            <el-input v-model="formData.contact1Email" placeholder="请输入联系人1邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="联系人2" prop="contact2Name">
            <el-input v-model="formData.contact2Name" placeholder="请输入联系人2" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系人2-电话" prop="contact2Telephone">
            <el-input v-model="formData.contact2Telephone" placeholder="请输入联系人2电话" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系人2-邮箱" prop="contact2Email">
            <el-input v-model="formData.contact2Email" placeholder="请输入联系人2邮箱" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="社会信用代码" prop="creditCode">
            <el-input v-model="formData.creditCode" placeholder="请输入统一社会信用代码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 编辑/详情时显示关联数据 tab -->
    <el-tabs v-if="formType !== 'create' && formData.id" v-model="activeTab" class="mt-10px">
      <el-tab-pane label="产品清单" name="productSalesLine" lazy>
        <ClientProductSalesLineList :clientId="formData.id" />
      </el-tab-pane>
      <el-tab-pane label="销售记录" name="productSales" lazy>
        <ClientProductSalesList :clientId="formData.id" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MdClientApi, MdClientVO } from '@/api/mes/md/client'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { CommonStatusEnum } from '@/utils/constants'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import ClientProductSalesLineList from './ClientProductSalesLineList.vue'
import ClientProductSalesList from './ClientProductSalesList.vue'

defineOptions({ name: 'MdClientForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增客户',
    update: '修改客户',
    detail: '查看客户'
  }
  return titles[formType.value] || formType.value
})
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const activeTab = ref('productSalesLine') // 当前激活的 tab
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  nickname: undefined,
  englishName: undefined,
  description: undefined,
  logo: undefined,
  type: undefined,
  address: undefined,
  website: undefined,
  email: undefined,
  telephone: undefined,
  contact1Name: undefined,
  contact1Telephone: undefined,
  contact1Email: undefined,
  contact2Name: undefined,
  contact2Telephone: undefined,
  contact2Email: undefined,
  creditCode: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '客户编码不能为空', trigger: 'blur' }],
  name: [
    { required: true, message: '客户名称不能为空', trigger: 'blur' },
    { max: 100, message: '客户名称不能超过100个字符', trigger: 'blur' }
  ],
  type: [{ required: true, message: '客户类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  contact1Email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  contact2Email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ]
})
const formRef = ref() // 表单 Ref

/** 生成客户编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.MD_CLIENT_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  activeTab.value = 'productSalesLine'
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MdClientApi.getClient(id)
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
    const data = formData.value as unknown as MdClientVO
    if (formType.value === 'create') {
      await MdClientApi.createClient(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdClientApi.updateClient(data)
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
    nickname: undefined,
    englishName: undefined,
    description: undefined,
    logo: undefined,
    type: undefined,
    address: undefined,
    website: undefined,
    email: undefined,
    telephone: undefined,
    contact1Name: undefined,
    contact1Telephone: undefined,
    contact1Email: undefined,
    contact2Name: undefined,
    contact2Telephone: undefined,
    contact2Email: undefined,
    creditCode: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
