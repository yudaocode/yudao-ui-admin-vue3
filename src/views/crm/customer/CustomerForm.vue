<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <!-- TODO @wanwan：name 参数校验，必填 -->
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="所属行业" prop="industryId">
          <el-select v-model="formData.industryId" placeholder="请选择所属行业">
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item label="客户来源" prop="source">
          <el-select v-model="formData.source" placeholder="请选择客户来源">
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户等级" prop="level">
          <el-select v-model="formData.level" placeholder="请选择客户等级">
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item label="手机" prop="mobile">
          <el-input v-model="formData.mobile" placeholder="请输入手机" />
        </el-form-item>
        <el-form-item label="电话" prop="telephone">
          <el-input v-model="formData.telephone" placeholder="请输入电话" />
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="QQ" prop="qq">
          <el-input v-model="formData.qq" placeholder="请输入QQ" />
        </el-form-item>
      </el-row>
      <el-row>
        <el-form-item label="微信" prop="wechat">
          <el-input v-model="formData.wechat" placeholder="请输入微信" />
        </el-form-item>
        <el-form-item label="网址" prop="website">
          <el-input v-model="formData.website" placeholder="请输入网址" />
        </el-form-item>
      </el-row>
      <el-row>
        <!-- TODO @wanwan：地区的多级选择，可以参考 UserForm.vue 的 所在地 areaId -->
        <el-form-item label="地区编号" prop="areaId">
          <el-input v-model="formData.areaId" placeholder="请输入地区编号" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detailAddress">
          <el-input v-model="formData.detailAddress" placeholder="请输入详细地址" />
        </el-form-item>
      </el-row>
      <!-- TODO @wanwan： 少一个负责人字段，默认先选中自己；可以先参考 TaskAssignRuleForm.vue 的 formData.userIds；注意，新增的时候，可以选择；修改的时候，只展示 -->
      <el-row>
        <el-form-item label="下次联系时间" prop="contactNextTime">
          <el-date-picker
            v-model="formData.contactNextTime"
            type="date"
            value-format="x"
            placeholder="选择下次联系时间"
          />
        </el-form-item>
      </el-row>
      <el-form-item label="客户描述" prop="description">
        <el-input v-model="formData.description" placeholder="请输入客户描述" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  mobile: undefined,
  industryId: undefined,
  level: undefined,
  source: undefined,
  telephone: undefined,
  website: undefined,
  qq: undefined,
  wechat: undefined,
  email: undefined,
  description: undefined,
  remark: undefined,
  areaId: undefined,
  detailAddress: undefined,
  contactNextTime: undefined
})
const formRules = reactive({
  name: [{ require: true, message: '客户名称不能为空', trigger: 'blur' }]
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
      formData.value = await CustomerApi.getCustomer(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as CustomerApi.CustomerVO
    if (formType.value === 'create') {
      await CustomerApi.createCustomer(data)
      message.success(t('common.createSuccess'))
    } else {
      await CustomerApi.updateCustomer(data)
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
    name: undefined,
    mobile: undefined,
    industryId: undefined,
    level: undefined,
    source: undefined,
    telephone: undefined,
    website: undefined,
    qq: undefined,
    wechat: undefined,
    email: undefined,
    description: undefined,
    remark: undefined,
    areaId: undefined,
    detailAddress: undefined,
    contactNextTime: undefined
  }
  formRef.value?.resetFields()
}
</script>
