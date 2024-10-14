<template>
  <Dialog title="变更商机状态" v-model="dialogVisible" width="400">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="商机阶段" prop="status">
        <el-select v-model="formData.status" placeholder="请选择商机阶段" class="w-1/1">
          <el-option
            v-for="item in statusList"
            :key="item.id"
            :label="item.name + '(赢单率：' + item.percent + '%)'"
            :value="item.id"
          />
          <el-option
            v-for="item in BusinessStatusApi.DEFAULT_STATUSES"
            :key="item.endStatus"
            :label="item.name + '(赢单率：' + item.percent + '%)'"
            :value="-item.endStatus"
          />
        </el-select>
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
import * as BusinessStatusApi from '@/api/crm/business/status'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  id: undefined,
  statusId: undefined,
  endStatus: undefined,
  status: undefined
})
const formRules = reactive({
  status: [{ required: true, message: '商机阶段不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const statusList = ref([]) // 商机状态列表

/** 打开弹窗 */
const open = async (business: BusinessApi.BusinessVO) => {
  dialogVisible.value = true
  resetForm()
  formData.value = {
    id: business.id,
    statusId: business.statusId,
    endStatus: business.endStatus,
    status: business.endStatus != null ? -business.endStatus : business.statusId
  }
  // 加载状态列表
  formLoading.value = true
  try {
    statusList.value = await BusinessStatusApi.getBusinessStatusSimpleList(business.statusTypeId)
  } finally {
    formLoading.value = false
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
  // 提交请求
  formLoading.value = true
  try {
    await BusinessApi.updateBusinessStatus({
      id: formData.value.id,
      statusId: formData.value.status > 0 ? formData.value.status : undefined,
      endStatus: formData.value.status < 0 ? -formData.value.status : undefined
    })
    message.success('更新商机状态成功')
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
    statusId: undefined,
    endStatus: undefined,
    status: undefined
  }
  formRef.value?.resetFields()
}
</script>
