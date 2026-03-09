<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="通知单编号" prop="noticeCode">
            <el-input v-model="formData.noticeCode" placeholder="请输入通知单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="通知单名称" prop="noticeName">
            <el-input v-model="formData.noticeName" placeholder="请输入通知单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="客户" prop="clientId">
            <MdClientSelect v-model="formData.clientId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="发货日期" prop="salesDate">
            <el-date-picker
              v-model="formData.salesDate"
              type="date"
              value-format="x"
              placeholder="请选择发货日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="收货人" prop="recipientName">
            <el-input v-model="formData.recipientName" placeholder="请输入收货人" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系方式" prop="recipientTelephone">
            <el-input v-model="formData.recipientTelephone" placeholder="请输入联系方式" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="收货地址" prop="recipientAddress">
            <el-input v-model="formData.recipientAddress" placeholder="请输入收货地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 编辑时展示物料信息 -->
    <template v-if="formType === 'update' && formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <SalesNoticeLineList :notice-id="formData.id" />
    </template>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!isDetail">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmSalesNoticeApi, WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'
import SalesNoticeLineList from './SalesNoticeLineList.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'

defineOptions({ name: 'SalesNoticeForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formType = ref('')
const isDetail = computed(() => formType.value === 'detail')
const dialogTitle = computed(() => {
  const titles = {
    create: '新增发货通知单',
    update: '修改发货通知单',
    detail: '查看发货通知单'
  }
  return titles[formType.value] || t('action.' + formType.value)
})
const formData = ref({
  id: undefined,
  noticeCode: undefined,
  noticeName: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  salesDate: undefined,
  recipientName: undefined,
  recipientTelephone: undefined,
  recipientAddress: undefined,
  remark: undefined
})
const formRules = reactive({
  noticeCode: [{ required: true, message: '通知单编号不能为空', trigger: 'blur' }],
  noticeName: [{ required: true, message: '通知单名称不能为空', trigger: 'blur' }],
  clientId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  salesDate: [{ required: true, message: '请选择发货日期', trigger: 'change' }]
})
const formRef = ref()

/** 生成通知单编号 */
const generateCode = () => {
  formData.value.noticeCode = 'SN' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmSalesNoticeApi.getSalesNotice(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmSalesNoticeVO
    if (formType.value === 'create') {
      const res = await WmSalesNoticeApi.createSalesNotice(data)
      message.success(t('common.createSuccess'))
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmSalesNoticeApi.updateSalesNotice(data)
      message.success(t('common.updateSuccess'))
      dialogVisible.value = false
    }
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    noticeCode: undefined,
    noticeName: undefined,
    salesOrderCode: undefined,
    clientId: undefined,
    salesDate: undefined,
    recipientName: undefined,
    recipientTelephone: undefined,
    recipientAddress: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
