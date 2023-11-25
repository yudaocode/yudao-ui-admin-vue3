<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="商机名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入商机名称" />
      </el-form-item>
      <!-- TODO 芋艿：客户列表的组件 -->
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
              placeholder="请选择客户"
              @click="openCustomerSelect"
              v-model="formData.customerName"
            />
          </template>
          <el-table :data="customerList" ref="multipleTableRef" @select="handleSelectionChange">
            <el-table-column width="55" label="选择" type="selection" />
            <el-table-column width="100" label="编号" property="id" />
            <el-table-column width="150" label="客户名称" property="name" />
            <el-table-column width="100" label="客户来源" prop="source" align="center">
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
                @pagination="getCustomerList"
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
      <el-form-item label="商机状态类型" prop="statusTypeId">
        <el-select
          v-model="formData.statusTypeId"
          placeholder="请选择商机状态类型"
          clearable
          size="small"
          @change="changeBusinessStatusType"
        >
          <el-option
            v-for="item in businessStatusTypeList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商机状态" prop="statusId">
        <el-select v-model="formData.statusId" placeholder="请选择商机状态" clearable size="small">
          <el-option
            v-for="item in businessStatusList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="预计成交日期" prop="dealTime">
        <el-date-picker
          v-model="formData.dealTime"
          type="date"
          value-format="x"
          placeholder="选择预计成交日期"
        />
      </el-form-item>
      <el-form-item label="商机金额" prop="price">
        <el-input v-model="formData.price" placeholder="请输入商机金额" />
      </el-form-item>
      <el-form-item label="整单折扣" prop="discountPercent">
        <el-input v-model="formData.discountPercent" placeholder="请输入整单折扣" />
      </el-form-item>
      <el-form-item label="产品总金额" prop="productPrice">
        <el-input v-model="formData.productPrice" placeholder="请输入产品总金额" />
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
import * as BusinessApi from '@/api/crm/business'
import * as BusinessStatusTypeApi from '@/api/crm/businessStatusType'
import * as CustomerApi from '@/api/crm/customer'
import { DICT_TYPE } from '@/utils/dict'
import { ElTable } from 'element-plus'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  statusTypeId: undefined,
  statusId: undefined,
  contactNextTime: undefined,
  customerId: undefined,
  dealTime: undefined,
  price: undefined,
  discountPercent: undefined,
  productPrice: undefined,
  remark: undefined,
  ownerUserId: undefined,
  roUserIds: undefined,
  rwUserIds: undefined,
  endStatus: undefined,
  endRemark: undefined,
  contactLastTime: undefined,
  followUpStatus: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '商机名称不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const businessStatusList = ref([]) // 商机状态列表
const businessStatusTypeList = ref([]) //商机状态类型列表
const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const customerList = ref([]) // 客户列表的数据

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
      formData.value = await BusinessApi.getBusiness(id)
    } finally {
      formLoading.value = false
    }
  }
  // 加载商机状态类型列表
  businessStatusTypeList.value = await BusinessStatusTypeApi.getBusinessStatusTypeList()
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
    const data = formData.value as unknown as BusinessApi.BusinessVO
    if (formType.value === 'create') {
      await BusinessApi.createBusiness(data)
      message.success(t('common.createSuccess'))
    } else {
      await BusinessApi.updateBusiness(data)
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
    statusTypeId: undefined,
    statusId: undefined,
    contactNextTime: undefined,
    customerId: undefined,
    dealTime: undefined,
    price: undefined,
    discountPercent: undefined,
    productPrice: undefined,
    remark: undefined,
    ownerUserId: undefined,
    roUserIds: undefined,
    rwUserIds: undefined,
    endStatus: undefined,
    endRemark: undefined,
    contactLastTime: undefined,
    followUpStatus: undefined
  }
  formRef.value?.resetFields()
}

/** 加载商机状态列表 */
const changeBusinessStatusType = async (typeId: number) => {
  businessStatusList.value = await BusinessStatusTypeApi.getBusinessStatusListByTypeId(typeId)
}

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  mobile: null,
  industryId: null,
  level: null,
  source: null
})
// 选择客户
const showCustomer = ref(false)
const openCustomerSelect = () => {
  showCustomer.value = !showCustomer.value
  queryParams.pageNo = 1
  getCustomerList()
}
/** 查询客户列表 */
const getCustomerList = async () => {
  loading.value = true
  try {
    const data = await CustomerApi.getCustomerPage(queryParams)
    console.log(JSON.stringify(data))
    customerList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
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
</script>
