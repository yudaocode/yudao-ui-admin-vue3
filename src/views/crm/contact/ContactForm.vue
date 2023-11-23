<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" :width="800">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
      :inline="true"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="负责人" prop="ownerUserId">
        <el-select
          v-model="ownerUserList"
          placeholder="请选择负责人"
          multiple
          value-key="id"
          lable-key="nickname"
          @click="openOwerForm('open')"
        >
          <el-option
            v-for="item in ownerUserList"
            :key="item.id"
            :label="item.nickname"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <!-- TODO 芋艿：封装成一个组件 -->
      <el-form-item label="客户名称" prop="customerName">
        <el-popover
          placement="bottom"
          :width="600"
          trigger="click"
          :teleported="false"
          :visible="showCustomer"
          :offset="10"
        >
          <template #reference>
            <el-input
              placeholder="请选择"
              @click="openCustomerSelect"
              v-model="formData.customerName"
            />
          </template>
          <el-table :data="list" ref="multipleTableRef" @select="handleSelectionChange">
            <el-table-column label="选择" type="selection" width="55" />
            <el-table-column width="100" property="id" label="编号" />
            <el-table-column width="150" property="name" label="客户名称" />
            <el-table-column label="客户来源" align="center" prop="source" width="100">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="scope.row.source" />
              </template>
            </el-table-column>
            <el-table-column label="客户等级" align="center" prop="level" width="120">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="scope.row.level" />
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <el-row :gutter="20">
            <el-col>
              <Pagination
                :total="total"
                v-model:page="queryParams.pageNo"
                v-model:limit="queryParams.pageSize"
                @pagination="getList"
                layout="sizes, prev, pager, next"
              />
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="10" :offset="13">
              <el-button @click="selectCustomer">确认</el-button>
              <el-button @click="showCustomer = false">取消</el-button>
            </el-col>
          </el-row>
        </el-popover>
      </el-form-item>
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
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="formData.mobile" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="座机" prop="telephone">
        <el-input v-model="formData.telephone" placeholder="请输入座机" style="width: 215px" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="QQ" prop="qq">
        <el-input v-model="formData.qq" placeholder="请输入QQ" style="width: 215px" />
      </el-form-item>
      <el-form-item label="微信" prop="webchat">
        <el-input v-model="formData.webchat" placeholder="请输入微信" />
      </el-form-item>
      <el-form-item label="下次联系时间" prop="nextTime">
        <el-date-picker
          v-model="formData.nextTime"
          type="date"
          value-format="x"
          placeholder="选择下次联系时间"
        />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="直属上级" prop="parentId">
        <el-select v-model="formData.parentId" placeholder="请选择">
          <el-option
            v-for="item in allContactList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
            :disabled="item.id == formData.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="职位" prop="post">
        <el-input v-model="formData.post" placeholder="请输入职位" />
      </el-form-item>

      <el-form-item label="是否关键决策人" prop="policyMakers" style="width: 400px">
        <el-radio-group v-model="formData.policyMakers">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
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
  <OwerSelect
    ref="owerRef"
    @confirmOwerSelect="owerSelectValue"
    :initOwerUser="formData.ownerUserId"
  />
</template>
<script setup lang="ts">
import * as ContactApi from '@/api/crm/contact'
import { DICT_TYPE, getIntDictOptions, getBoolDictOptions } from '@/utils/dict'
import OwerSelect from './OwerSelect.vue'
import * as UserApi from '@/api/system/user'
import * as CustomerApi from '@/api/crm/customer'
import { ElTable } from 'element-plus'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  nextTime: undefined,
  mobile: undefined,
  telephone: undefined,
  email: undefined,
  customerId: undefined,
  customerName: undefined,
  address: undefined,
  remark: undefined,
  ownerUserId: undefined,
  lastTime: undefined,
  id: undefined,
  parentId: undefined,
  name: undefined,
  post: undefined,
  qq: undefined,
  webchat: undefined,
  sex: undefined,
  policyMakers: undefined
})
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  mobile: null,
  industryId: null,
  level: null,
  source: null
})
const formRules = reactive({
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '负责人不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const ownerUserList = ref<any[]>([])
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  allContactList.value = await ContactApi.simpleAlllist()
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ContactApi.getContact(id)
      userList.value = await UserApi.getSimpleUserList()
      await gotOwnerUser(formData.value.ownerUserId)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CustomerApi.getCustomerPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const gotOwnerUser = (owerUserId: any) => {
  if (owerUserId !== null) {
    owerUserId.split(',').forEach((item: string) => {
      userList.value.find((user: { id: any }) => {
        if (user.id == item) {
          ownerUserList.value.push(user)
        }
      })
    })
  }
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  owerSelectValue(ownerUserList)
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
  formData.value = {
    nextTime: undefined,
    mobile: undefined,
    telephone: undefined,
    email: undefined,
    customerId: undefined,
    address: undefined,
    remark: undefined,
    ownerUserId: undefined,
    lastTime: undefined,
    id: undefined,
    parentId: undefined,
    name: undefined,
    post: undefined,
    qq: undefined,
    webchat: undefined,
    sex: undefined,
    policyMakers: undefined
  }
  formRef.value?.resetFields()
  ownerUserList.value = []
}

/** 添加/修改操作 */
// TODO @zyna：owner？拼写要注意哈；
const owerRef = ref()
const openOwerForm = (type: string) => {
  owerRef.value.open(type, ownerUserList.value)
}
const owerSelectValue = (value) => {
  ownerUserList.value = value.value
  formData.value.ownerUserId = undefined
  value.value.forEach((item, index) => {
    if (index != 0) {
      formData.value.ownerUserId = formData.value.ownerUserId + ',' + item.id
    } else {
      formData.value.ownerUserId = item.id
    }
  })
}
// 选择客户
const showCustomer = ref(false)
const openCustomerSelect = () => {
  showCustomer.value = !showCustomer.value
  queryParams.pageNo = 1
  getList()
}
const multipleTableRef = ref<InstanceType<typeof ElTable>>()
const multipleSelection = ref()
const handleSelectionChange = ({}, row) => {
  multipleSelection.value = row
  multipleTableRef.value!.clearSelection()
  multipleTableRef.value!.toggleRowSelection(row, undefined)
}
const selectCustomer = () => {
  formData.value.customerId = multipleSelection.value.id
  formData.value.customerName = multipleSelection.value.name
  showCustomer.value = !showCustomer.value
}
const allContactList = ref([]) // 所有联系人列表
onMounted(async () => {
  allContactList.value = await ContactApi.simpleAlllist()
})
</script>
