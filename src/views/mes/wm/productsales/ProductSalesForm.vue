<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="出库单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入出库单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出库单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入出库单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发货通知单" prop="noticeId">
            <WmSalesNoticeSelect v-model="formData.noticeId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <!-- DONE @芋艿：【暂时先忽略我这个想法】销售订单编号、出库日期，是不是不用记录 -->
        <!-- DONE @芋艿：【暂时先忽略我这个想法】目前发货通知单选择后，可设置销售订单比那好、出库日期、客户；（和上面这个 DONE 有关联）（暂时保持手动填写，未来可考虑自动填充） -->
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input
              v-model="formData.salesOrderCode"
              placeholder="请输入销售订单编号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出库日期" prop="salesDate">
            <el-date-picker
              v-model="formData.salesDate"
              type="date"
              value-format="x"
              placeholder="请选择出库日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="收货人" prop="contactName">
            <el-input
              v-model="formData.contactName"
              placeholder="请输入收货人"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系方式" prop="contactTelephone">
            <el-input
              v-model="formData.contactTelephone"
              placeholder="请输入联系方式"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider content-position="left">运输信息</el-divider>
      <el-row>
        <el-col :span="8">
          <el-form-item label="承运商" prop="carrier">
            <el-input
              v-model="formData.carrier"
              placeholder="请输入承运商"
              :disabled="!isShipping && isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="运输单号" prop="shippingNumber">
            <el-input
              v-model="formData.shippingNumber"
              placeholder="请输入运输单号"
              :disabled="!isShipping && isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示行项目信息（出库物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ProductSalesLineList :sales-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isPick" @click="handleStock" type="primary" :disabled="formLoading">
        执行拣货
      </el-button>
      <el-button v-if="isShipping" @click="handleShipping" type="primary" :disabled="formLoading">
        确认填写
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmProductSalesApi, WmProductSalesVO } from '@/api/mes/wm/productsales'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import WmSalesNoticeSelect from '@/views/mes/wm/salesnotice/components/WmSalesNoticeSelect.vue'
import ProductSalesLineList from './ProductSalesLineList.vue'

defineOptions({ name: 'ProductSalesForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / pick / shipping / detail
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  clientId: undefined,
  noticeId: undefined,
  salesOrderCode: undefined,
  salesDate: undefined,
  contactName: undefined,
  contactTelephone: undefined,
  carrier: undefined,
  shippingNumber: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '出库单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '出库单名称不能为空', trigger: 'blur' }],
  salesDate: [{ required: true, message: '出库日期不能为空', trigger: 'change' }],
  clientId: [{ required: true, message: '客户不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

const isUpdate = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isPick = computed(() => formType.value === 'pick') // 是否为拣货模式
const isShipping = computed(() => formType.value === 'shipping') // 是否为填写运单模式
const isHeaderReadonly = computed(() => ['pick', 'shipping', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增销售出库单',
    update: '编辑销售出库单',
    pick: '执行拣货',
    shipping: '填写运单',
    detail: '销售出库单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成出库单编号 */
const generateCode = () => {
  formData.value.code = 'PS' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/拣货/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmProductSalesApi.getProductSales(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单（create/update 模式） */
const emit = defineEmits(['success'])
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmProductSalesVO
    if (formType.value === 'create') {
      const res = await WmProductSalesApi.createProductSales(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmProductSalesApi.updateProductSales(data)
      message.success('修改成功')
    }
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 执行拣货 */
const handleStock = async () => {
  try {
    formLoading.value = true
    // 校验出库数量与拣货数量是否一致
    const quantityMatch = await WmProductSalesApi.checkProductSalesQuantity(formData.value.id!)
    if (!quantityMatch) {
      await message.confirm('出库数量与拣货数量不一致，确认执行拣货？')
    }
    await WmProductSalesApi.stockProductSales(formData.value.id!)
    message.success('拣货成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 填写运单 */
const handleShipping = async () => {
  try {
    await message.confirm('确认提交运单信息？')
    formLoading.value = true
    const data = {
      id: formData.value.id,
      carrier: formData.value.carrier,
      shippingNumber: formData.value.shippingNumber
    } as unknown as WmProductSalesVO
    await WmProductSalesApi.shippingProductSales(data)
    message.success('运单信息填写成功')
    dialogVisible.value = false
    emit('success')
  } catch {
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
    clientId: undefined,
    noticeId: undefined,
    salesOrderCode: undefined,
    salesDate: undefined,
    contactName: undefined,
    contactTelephone: undefined,
    carrier: undefined,
    shippingNumber: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
