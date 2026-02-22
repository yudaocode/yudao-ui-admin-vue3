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
            <el-select
              v-model="formData.vendorId"
              placeholder="请选择供应商"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="vendor in vendorList"
                :key="vendor.id"
                :label="vendor.name"
                :value="vendor.id"
              />
            </el-select>
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
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <ArrivalNoticeLineList :notice-id="formData.id" />
    </template>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { generateRandomStr } from '@/utils'
import { WmArrivalNoticeApi, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import { MdVendorApi } from '@/api/mes/md/vendor'
import ArrivalNoticeLineList from './ArrivalNoticeLineList.vue'

defineOptions({ name: 'ArrivalNoticeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const vendorList = ref<any[]>([]) // 供应商列表
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
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  vendorList.value = await MdVendorApi.getVendorSimpleList()
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
      await WmArrivalNoticeApi.createArrivalNotice(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmArrivalNoticeApi.updateArrivalNotice(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
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
