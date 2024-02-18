<!-- TODO @puhui999：这个好像和 detail 重复了？？？能不能复用 detail 哈？ -->
<template>
  <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="110px">
    <el-row>
      <el-col :span="24" class="mb-10px">
        <CardTitle title="基本信息" />
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入合同名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同编号" prop="no">
          <el-input v-model="formData.no" placeholder="请输入合同编号" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="formData.customerId">
            <el-option
              v-for="item in customerList"
              :key="item.id"
              :label="item.name"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="客户签约人" prop="contactId">
          <el-select v-model="formData.contactId" :disabled="!formData.customerId">
            <el-option
              v-for="item in getContactOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="公司签约人" prop="signUserId">
          <el-select v-model="formData.signUserId">
            <el-option
              v-for="item in userList"
              :key="item.id"
              :label="item.nickname"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="负责人" prop="ownerUserId">
          <el-select v-model="formData.ownerUserId">
            <el-option
              v-for="item in userList"
              :key="item.id"
              :label="item.nickname"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商机名称" prop="businessId">
          <el-select v-model="formData.businessId">
            <el-option
              v-for="item in businessList"
              :key="item.id"
              :label="item.name"
              :value="item.id!"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="合同金额(元)" prop="price">
          <el-input v-model="formData.price" placeholder="请输入合同金额" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="下单日期" prop="orderDate">
          <el-date-picker
            v-model="formData.orderDate"
            placeholder="选择下单日期"
            type="date"
            value-format="x"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            placeholder="选择开始时间"
            type="date"
            value-format="x"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            placeholder="选择结束时间"
            type="date"
            value-format="x"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" :rows="3" placeholder="请输入备注" type="textarea" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="产品列表" prop="productList">
          <ProductList v-model="formData.productItems" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="整单折扣(%)" prop="discountPercent">
          <el-input v-model="formData.discountPercent" placeholder="请输入整单折扣" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="产品总金额(元)" prop="productPrice">
          <el-input v-model="formData.productPrice" placeholder="请输入产品总金额" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <CardTitle class="mb-10px" title="审批信息" />
      </el-col>
      <el-col :span="12">
        <el-button
          class="m-20px"
          link
          type="primary"
          @click="BPMLModelRef?.handleBpmnDetail('contract-approve')"
        >
          查看工作流
        </el-button>
      </el-col>
    </el-row>
  </el-form>
  <BPMLModel ref="BPMLModelRef" />
</template>
<script lang="ts" setup>
import * as CustomerApi from '@/api/crm/customer'
import * as ContractApi from '@/api/crm/contract'
import * as UserApi from '@/api/system/user'
import * as ContactApi from '@/api/crm/contact'
import * as BusinessApi from '@/api/crm/business'
import ProductList from '@/views/crm/contract/components/ProductList.vue'
// import BPMLModel from '@/views/crm/contract/components/BPMLModel.vue'

defineOptions({ name: 'ContractDetailOA' })
const props = defineProps<{ id?: number }>()
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<ContractApi.ContractVO>({} as ContractApi.ContractVO)
const formRef = ref() // 表单 Ref
const BPMLModelRef = ref<InstanceType<typeof BPMLModel>>()
watch(
  () => formData.value.productItems,
  (val) => {
    if (!val || val.length === 0) {
      formData.value.productPrice = 0
      return
    }
    // 使用reduce函数进行累加
    formData.value.productPrice = val.reduce(
      (accumulator, currentValue) =>
        isNaN(accumulator + currentValue.totalPrice) ? 0 : accumulator + currentValue.totalPrice,
      0
    )
  },
  { deep: true }
)
/** 打开弹窗 */
const getFormData = async () => {
  await getAllApi()
  formLoading.value = true
  try {
    formData.value = await ContractApi.getContract(props.id!)
  } finally {
    formLoading.value = false
  }
}
const getAllApi = async () => {
  await Promise.all([getCustomerList(), getUserList(), getContactListList(), getBusinessList()])
}
const customerList = ref<CustomerApi.CustomerVO[]>([])
/** 获取客户 */
const getCustomerList = async () => {
  customerList.value = await CustomerApi.getSimpleCustomerList()
}
const contactList = ref<ContactApi.ContactVO[]>([])
/** 动态获取客户联系人 */
const getContactOptions = computed(() =>
  contactList.value.filter((item) => item.customerId === formData.value.customerId)
)
const getContactListList = async () => {
  contactList.value = await ContactApi.getSimpleContactList()
}
const userList = ref<UserApi.UserVO[]>([])
/** 获取用户列表 */
const getUserList = async () => {
  userList.value = await UserApi.getSimpleUserList()
}
const businessList = ref<BusinessApi.BusinessVO[]>([])
/** 获取商机 */
const getBusinessList = async () => {
  businessList.value = await BusinessApi.getSimpleBusinessList()
}

onMounted(() => {
  getFormData()
})
</script>
