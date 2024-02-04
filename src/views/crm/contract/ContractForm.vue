<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="820">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="合同编号" prop="no">
            <el-input v-model="formData.no" placeholder="请输入合同编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入合同名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerId">
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
          <el-form-item label="合同金额" prop="price">
            <el-input v-model="formData.price" placeholder="请输入合同金额" />
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
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              :rows="3"
              placeholder="请输入备注"
              type="textarea"
            />
          </el-form-item>
        </el-col>
        <!-- TODO @puhui999：productItems 改成 products 会更好点；因为它不是 item 哈 -->
        <el-col :span="24">
          <el-form-item label="产品列表" prop="productList">
            <ProductList v-model="formData.productItems" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="整单折扣(%)" prop="discountPercent">
            <el-input-number
              v-model="formData.discountPercent"
              :min="0"
              :max="100"
              :precision="0"
              placeholder="请输入整单折扣"
              class="!w-100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品总金额(元)" prop="productPrice">
            {{ fenToYuan(formData.productPrice) }}
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as CustomerApi from '@/api/crm/customer'
import * as ContractApi from '@/api/crm/contract'
import * as UserApi from '@/api/system/user'
import * as ContactApi from '@/api/crm/contact'
import * as BusinessApi from '@/api/crm/business'
import ProductList from './components/ProductList.vue'
import { fenToYuan } from '@/utils'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ContractApi.ContractVO>({} as ContractApi.ContractVO)
const formRules = reactive({
  name: [{ required: true, message: '合同名称不能为空', trigger: 'blur' }],
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  orderDate: [{ required: true, message: '下单日期不能为空', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '负责人不能为空', trigger: 'blur' }],
  no: [{ required: true, message: '合同编号不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 监听合同产品变化，计算合同产品总价 */
watch(
  () => formData.value.productItems,
  (val) => {
    if (!val || val.length === 0) {
      formData.value.productPrice = 0
      return
    }
    // 使用 reduce 函数进行累加
    formData.value.productPrice = val.reduce(
      (accumulator, currentValue) =>
        isNaN(accumulator + currentValue.totalPrice) ? 0 : accumulator + currentValue.totalPrice,
      0
    )
  },
  { deep: true }
)

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
      formData.value = await ContractApi.getContract(id)
    } finally {
      formLoading.value = false
    }
  }
  await getAllApi()
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
    const data = unref(formData.value) as unknown as ContractApi.ContractVO
    if (formType.value === 'create') {
      await ContractApi.createContract(data)
      message.success(t('common.createSuccess'))
    } else {
      await ContractApi.updateContract(data)
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
  formData.value = {} as ContractApi.ContractVO
  formRef.value?.resetFields()
}

/** 获取其它相关数据 */
const getAllApi = async () => {
  await Promise.all([getCustomerList(), getUserList(), getContactListList(), getBusinessList()])
}

/** 获取客户 */
const customerList = ref<CustomerApi.CustomerVO[]>([])
const getCustomerList = async () => {
  customerList.value = await CustomerApi.getSimpleCustomerList()
}

/** 动态获取客户联系人 */
const contactList = ref<ContactApi.ContactVO[]>([])
const getContactOptions = computed(() =>
  contactList.value.filter((item) => item.customerId === formData.value.customerId)
)
const getContactListList = async () => {
  contactList.value = await ContactApi.getSimpleContactList()
}

/** 获取用户列表 */
const userList = ref<UserApi.UserVO[]>([])
const getUserList = async () => {
  userList.value = await UserApi.getSimpleUserList()
}

/** 获取商机 */
const businessList = ref<BusinessApi.BusinessVO[]>([])
const getBusinessList = async () => {
  businessList.value = await BusinessApi.getSimpleBusinessList()
}
</script>
