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
          <el-form-item label="退货单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入退货单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="formType !== 'create'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退货单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入退货单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售订单号" prop="salesOrderCode">
            <el-input
              v-model="formData.salesOrderCode"
              placeholder="请输入销售订单号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isHeaderReadonly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="退货日期" prop="returnDate">
            <el-date-picker
              v-model="formData.returnDate"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择退货日期"
              :disabled="isHeaderReadonly"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="退货原因" prop="returnReason">
            <el-input
              v-model="formData.returnReason"
              type="textarea"
              placeholder="请输入退货原因"
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
    </el-form>
    <!-- 非新建模式展示行项目信息（退货物料） -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ReturnSalesLineList :return-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isUpdate" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button v-if="isStock" @click="handleStock" type="primary" :disabled="formLoading">
        执行上架
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmReturnSalesApi, WmReturnSalesVO } from '@/api/mes/wm/returnsales'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import ReturnSalesLineList from './ReturnSalesLineList.vue'

defineOptions({ name: 'ReturnSalesForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / stock / detail
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  returnDate: undefined,
  returnReason: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '退货单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '退货单名称不能为空', trigger: 'blur' }],
  clientId: [{ required: true, message: '客户不能为空', trigger: 'change' }],
  returnDate: [{ required: true, message: '退货日期不能为空', trigger: 'change' }],
  returnReason: [{ required: true, message: '退货原因不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

const isUpdate = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isStock = computed(() => formType.value === 'stock') // 是否为上架模式
const isHeaderReadonly = computed(() => ['stock', 'detail'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增销售退货单',
    update: '编辑销售退货单',
    stock: '执行上架',
    detail: '销售退货单详情'
  }
  return titles[formType.value] || formType.value
})

/** 生成退货单编号 */
const generateCode = () => {
  formData.value.code = 'RS' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/上架/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmReturnSalesApi.getReturnSales(id)
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
    const data = formData.value as unknown as WmReturnSalesVO
    if (formType.value === 'create') {
      const res = await WmReturnSalesApi.createReturnSales(data)
      message.success('新增成功')
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmReturnSalesApi.updateReturnSales(data)
      message.success('修改成功')
    }
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 执行上架 */
const handleStock = async () => {
  try {
    await message.confirm('确认执行上架？')
    formLoading.value = true
    await WmReturnSalesApi.stockReturnSales(formData.value.id!)
    message.success('上架成功')
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
    salesOrderCode: undefined,
    clientId: undefined,
    returnDate: undefined,
    returnReason: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
