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
          <el-form-item label="通知单编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入通知单编号">
              <template #append>
                <el-button @click="generateCode" :disabled="formType === 'update'">
                  生成
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="通知单名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入通知单名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="采购订单编号" prop="purchaseOrderCode">
            <el-input v-model="formData.purchaseOrderCode" placeholder="请输入采购订单编号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="供应商" prop="vendorId">
            <MdVendorSelect v-model="formData.vendorId" :disabled="isDetail" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="到货日期" prop="arrivalDate">
            <el-date-picker
              v-model="formData.arrivalDate"
              type="date"
              value-format="x"
              placeholder="请选择到货日期"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="formData.contactName" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="联系方式" prop="contactTelephone">
            <el-input v-model="formData.contactTelephone" placeholder="请输入联系方式" />
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
      <ArrivalNoticeLineList :notice-id="formData.id" />
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
import { WmArrivalNoticeApi, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import ArrivalNoticeLineList from './ArrivalNoticeLineList.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'

defineOptions({ name: 'ArrivalNoticeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否为详情模式
const dialogTitle = computed(() => {
  const titles = {
    create: '新增到货通知单',
    update: '修改到货通知单',
    detail: '查看到货通知单'
  }
  return titles[formType.value] || t('action.' + formType.value)
})
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
  arrivalDate: undefined,
  contactName: undefined,
  contactTelephone: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '通知单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '通知单名称不能为空', trigger: 'blur' }],
  vendorId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  arrivalDate: [{ required: true, message: '请选择到货日期', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成通知单编号 */
const generateCode = () => {
  formData.value.code = 'AN' + generateRandomStr(10)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // DONE @AI：已改用 MdVendorSelect 组件，该组件会自动加载供应商列表
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmArrivalNoticeApi.getArrivalNotice(id)
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
    const data = formData.value as unknown as WmArrivalNoticeVO
    if (formType.value === 'create') {
      const res = await WmArrivalNoticeApi.createArrivalNotice(data)
      message.success(t('common.createSuccess'))
      // 新增成功后，切换到修改模式，设置 id
      formData.value.id = res
      formType.value = 'update'
    } else {
      await WmArrivalNoticeApi.updateArrivalNotice(data)
      message.success(t('common.updateSuccess'))
      dialogVisible.value = false
      emit('success')
    }
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
    purchaseOrderCode: undefined,
    vendorId: undefined,
    arrivalDate: undefined,
    contactName: undefined,
    contactTelephone: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
