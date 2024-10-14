<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1280">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="商机名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入商机名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="负责人" prop="ownerUserId">
            <el-select
              v-model="formData.ownerUserId"
              :disabled="formType !== 'create'"
              class="w-1/1"
            >
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.nickname"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户名称" prop="customerId">
            <el-select
              :disabled="formData.customerDefault"
              v-model="formData.customerId"
              placeholder="请选择客户"
              class="w-1/1"
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
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="商机状态组" prop="statusTypeId">
            <el-select
              v-model="formData.statusTypeId"
              placeholder="请选择商机状态组"
              clearable
              class="w-1/1"
              :disabled="formType !== 'create'"
            >
              <el-option
                v-for="item in statusTypeList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="预计成交日期" prop="dealTime">
            <el-date-picker
              v-model="formData.dealTime"
              type="date"
              value-format="x"
              placeholder="选择预计成交日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 子表的表单 -->
      <ContentWrap>
        <el-tabs v-model="subTabsName" class="-mt-15px -mb-10px">
          <el-tab-pane label="产品清单" name="product">
            <BusinessProductForm
              ref="productFormRef"
              :products="formData.products"
              :disabled="disabled"
            />
          </el-tab-pane>
        </el-tabs>
      </ContentWrap>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品总金额" prop="totalProductPrice">
            <el-input
              disabled
              v-model="formData.totalProductPrice"
              :formatter="erpPriceTableColumnFormatter"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="整单折扣（%）" prop="discountPercent">
            <el-input-number
              v-model="formData.discountPercent"
              placeholder="请输入整单折扣"
              controls-position="right"
              :min="0"
              :precision="2"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="折扣后金额" prop="price">
            <el-input
              disabled
              v-model="formData.totalPrice"
              placeholder="请输入商机金额"
              :formatter="erpPriceTableColumnFormatter"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as BusinessApi from '@/api/crm/business'
import * as BusinessStatusApi from '@/api/crm/business/status'
import * as CustomerApi from '@/api/crm/customer'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import BusinessProductForm from './components/BusinessProductForm.vue'
import { erpPriceMultiply, erpPriceTableColumnFormatter } from '@/utils'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  customerId: undefined,
  ownerUserId: undefined,
  statusTypeId: undefined,
  dealTime: undefined,
  discountPercent: 0,
  totalProductPrice: undefined,
  totalPrice: undefined,
  remark: undefined,
  products: [],
  contactId: undefined,
  customerDefault: false
})
const formRules = reactive({
  name: [{ required: true, message: '商机名称不能为空', trigger: 'blur' }],
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '负责人不能为空', trigger: 'blur' }],
  statusTypeId: [{ required: true, message: '商机状态组不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const userOptions = ref<UserApi.UserVO[]>([]) // 用户列表
const statusTypeList = ref([]) // 商机状态类型列表
const customerList = ref([]) // 客户列表的数据

/** 子表的表单 */
const subTabsName = ref('product')
const productFormRef = ref()

/** 计算 discountPrice、totalPrice 价格 */
watch(
  () => formData.value,
  (val) => {
    if (!val) {
      return
    }
    const totalProductPrice = val.products.reduce((prev, curr) => prev + curr.totalPrice, 0)
    const discountPrice =
      val.discountPercent != null
        ? erpPriceMultiply(totalProductPrice, val.discountPercent / 100.0)
        : 0
    const totalPrice = totalProductPrice - discountPrice
    // 赋值
    formData.value.totalProductPrice = totalProductPrice
    formData.value.totalPrice = totalPrice
  },
  { deep: true }
)

/** 打开弹窗 */
const open = async (type: string, id?: number, customerId?: number, contactId?: number) => {
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
  } else {
    if (customerId) {
      formData.value.customerId = customerId
      formData.value.customerDefault = true // 默认客户的选择，不允许变
    }
    // 自动关联 contactId 联系人编号
    if (contactId) {
      formData.value.contactId = contactId
    }
  }
  // 获得客户列表
  customerList.value = await CustomerApi.getCustomerSimpleList()
  // 加载商机状态类型列表
  statusTypeList.value = await BusinessStatusApi.getBusinessStatusTypeSimpleList()
  // 获得用户列表
  userOptions.value = await UserApi.getSimpleUserList()
  // 默认新建时选中自己
  if (formType.value === 'create') {
    formData.value.ownerUserId = useUserStore().getUser.id
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
  await productFormRef.value.validate()
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
    customerId: undefined,
    ownerUserId: undefined,
    statusTypeId: undefined,
    dealTime: undefined,
    discountPercent: 0,
    totalProductPrice: undefined,
    totalPrice: undefined,
    remark: undefined,
    products: [],
    contactId: undefined,
    customerDefault: false
  }
  formRef.value?.resetFields()
}
</script>
