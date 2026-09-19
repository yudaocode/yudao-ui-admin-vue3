<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <!-- 基础信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model.trim="formData.name" placeholder="请输入姓名" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="分类名称">
            <OaContactCategorySelect v-model="formData.categoryId" class="w-full" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 联系方式 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别">
            <el-radio-group v-model="formData.sex">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="2">女</el-radio>
              <el-radio :value="0">未知</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号码" prop="mobile">
            <el-input v-model.trim="formData.mobile" placeholder="请输入手机号码" maxlength="20" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model.trim="formData.email" placeholder="请输入邮箱" maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="公司电话">
            <el-input
              v-model.trim="formData.companyPhone"
              placeholder="请输入公司电话"
              maxlength="30"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 扩展信息 -->
      <el-form-item label="公司名称">
        <el-input
          v-model.trim="formData.companyName"
          placeholder="请输入公司名称"
          maxlength="100"
        />
      </el-form-item>
      <el-form-item label="联系地址">
        <el-input v-model.trim="formData.address" placeholder="请输入联系地址" maxlength="255" />
      </el-form-item>
      <el-form-item label="头像">
        <UploadImg v-model="formData.avatar" :limit="1" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model.trim="formData.remark"
          placeholder="请输入备注"
          type="textarea"
          :rows="3"
          maxlength="500"
        />
      </el-form-item>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import OaContactCategorySelect from './components/OaContactCategorySelect.vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as ContactApi from '@/api/oa/contact'

defineOptions({ name: 'OaContactForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改
const formData = ref<ContactApi.OaContactVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  mobile: [{ required: true, message: '手机号码不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增外部联系人' : '修改外部联系人'
  formType.value = type
  resetForm()

  formLoading.value = true
  try {
    // 修改时，设置数据
    if (id) {
      formData.value = await ContactApi.getContact(id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value || formLoading.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ContactApi.createContact(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ContactApi.updateContact(formData.value)
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
function resetForm() {
  formData.value = createDefaultFormData()
  formRef.value?.resetFields()
}

/** 创建联系人默认表单数据 */
function createDefaultFormData(): ContactApi.OaContactVO {
  return {
    categoryId: undefined,
    name: '',
    sex: 0,
    mobile: '',
    email: '',
    address: '',
    companyName: '',
    companyPhone: '',
    avatar: '',
    remark: ''
  }
}
</script>
