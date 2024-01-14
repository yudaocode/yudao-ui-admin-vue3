<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" :width="820">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" input-style="width:190px;" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="ownerUserId">
            <el-select
              v-model="formData.ownerUserId"
              lable-key="nickname"
              placeholder="请选择负责人"
              value-key="id"
            >
              <el-option
                v-for="item in userList"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerName">
            <el-select
              v-model="formData.customerId"
              lable-key="name"
              placeholder="请选择客户"
              value-key="id"
            >
              <el-option
                v-for="item in customerList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="sex">
            <el-select v-model="formData.sex" placeholder="请选择">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="手机号" prop="mobile">
            <el-input
              v-model="formData.mobile"
              input-style="width:190px;"
              placeholder="请输入手机号"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电话" prop="telephone">
            <el-input v-model="formData.telephone" placeholder="请输入电话" style="width: 215px" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              input-style="width:190px;"
              placeholder="请输入邮箱"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="QQ" prop="qq">
            <el-input v-model="formData.qq" placeholder="请输入QQ" style="width: 215px" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="微信" prop="wechat">
            <el-input
              v-model="formData.wechat"
              input-style="width:190px;"
              placeholder="请输入微信"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="下次联系时间" prop="contactNextTime">
            <el-date-picker
              v-model="formData.contactNextTime"
              placeholder="选择下次联系时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="所在地" prop="areaId">
            <el-tree-select
              v-model="formData.areaId"
              :data="areaList"
              :props="defaultProps"
              :render-after-expand="true"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地址" prop="detailAddress">
            <el-input
              v-model="formData.detailAddress"
              input-style="width:190px;"
              placeholder="请输入地址"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="直属上级" prop="parentId">
            <el-select v-model="formData.parentId" placeholder="请选择">
              <el-option
                v-for="item in allContactList"
                :key="item.id"
                :disabled="item.id == formData.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位" prop="post">
            <el-input v-model="formData.post" input-style="width:190px;" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="关键决策人" prop="master" style="width: 400px">
            <el-radio-group v-model="formData.master">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="dict.value"
                :label="dict.value"
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
            <el-input v-model="formData.remark" placeholder="请输入备注" />
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
import * as ContactApi from '@/api/crm/contact'
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import * as UserApi from '@/api/system/user'
import * as CustomerApi from '@/api/crm/customer'
import * as AreaApi from '@/api/system/area'
import { defaultProps } from '@/utils/tree'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const areaList = ref([]) // 地区列表
const formData = ref({
  contactNextTime: undefined,
  mobile: undefined,
  telephone: undefined,
  email: undefined,
  customerId: undefined,
  customerName: undefined,
  detailAddress: undefined,
  remark: undefined,
  ownerUserId: undefined,
  lastTime: undefined,
  id: undefined,
  parentId: undefined,
  name: undefined,
  post: undefined,
  qq: undefined,
  wechat: undefined,
  sex: undefined,
  master: false,
  areaId: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '负责人不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const ownerUserList = ref<any[]>([])
const userList = ref<UserApi.UserVO[]>([]) // 用户列表
// TODO 芋艿：统一的客户选择面板
const customerList = ref<CustomerApi.CustomerVO[]>([]) // 客户列表
const allContactList = ref<ContactApi.ContactVO[]>([]) // 所有联系人列表

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  allContactList.value = await ContactApi.getSimpleContactList()
  userList.value = await UserApi.getSimpleUserList()
  customerList.value = await CustomerApi.getSimpleCustomerList()
  areaList.value = await AreaApi.getAreaTree()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ContactApi.getContact(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // owerSelectValue(ownerUserList)
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ContactApi.ContactVO
    if (formType.value === 'create') {
      await ContactApi.createContact(data)
      message.success(t('common.createSuccess'))
    } else {
      await ContactApi.updateContact(data)
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
  // TODO zyna：ide 告警，看看怎么去掉哈；
  formData.value = {
    contactNextTime: undefined,
    mobile: undefined,
    telephone: undefined,
    email: undefined,
    customerId: undefined,
    detailAddress: undefined,
    remark: undefined,
    ownerUserId: undefined,
    lastTime: undefined,
    id: undefined,
    parentId: undefined,
    name: undefined,
    post: undefined,
    qq: undefined,
    wechat: undefined,
    sex: undefined,
    master: false
  }
  formRef.value?.resetFields()
  ownerUserList.value = []
}
</script>
