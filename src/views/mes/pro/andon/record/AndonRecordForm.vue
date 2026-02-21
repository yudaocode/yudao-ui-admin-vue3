<!-- 安灯呼叫记录 新增/详情弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      :disabled="formType === 'detail'"
      v-loading="formLoading"
    >
      <el-form-item label="工作站" prop="workstationId">
        <MdWorkstationSelect v-model="formData.workstationId" placeholder="请选择工作站" />
      </el-form-item>
      <el-form-item label="发起人" prop="userId">
        <el-input v-model="formData.userNickname" disabled placeholder="当前用户" />
      </el-form-item>
      <el-form-item label="生产工单" prop="workOrderId">
        <el-input v-model="formData.workOrderId" placeholder="请输入工单编号（可选）" type="number" />
      </el-form-item>
      <el-form-item label="工序" prop="processId">
        <el-input v-model="formData.processId" placeholder="请输入工序编号（可选）" type="number" />
      </el-form-item>
      <el-form-item label="呼叫原因" prop="reason">
        <el-select
          v-model="selectedConfigId"
          placeholder="请选择呼叫原因"
          clearable
          style="width: 100%"
          @change="handleConfigChange"
        >
          <el-option
            v-for="config in configList"
            :key="config.id"
            :label="config.reason"
            :value="config.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="级别" prop="level">
        <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
      <!-- 详情模式额外展示 -->
      <template v-if="formType === 'detail'">
        <el-form-item label="状态">
          <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="formData.status" />
        </el-form-item>
        <el-form-item label="处置时间" v-if="formData.handleTime">
          <el-input :model-value="formData.handleTime" disabled />
        </el-form-item>
        <el-form-item label="处置人" v-if="formData.handlerUserNickname">
          <el-input :model-value="formData.handlerUserNickname" disabled />
        </el-form-item>
      </template>
    </el-form>
    <template #footer v-if="formType !== 'detail'">
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProAndonRecordApi, ProAndonConfigApi, ProAndonConfigVO } from '@/api/mes/pro/andon'
import { DICT_TYPE } from '@/utils/dict'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'AndonRecordForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<any>({})
const formRules = reactive({
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '呼叫原因不能为空', trigger: 'change' }],
  level: [{ required: true, message: '级别不能为空', trigger: 'change' }]
})
const formRef = ref()
const configList = ref<ProAndonConfigVO[]>([])
const selectedConfigId = ref<number>()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 加载配置列表
  configList.value = await ProAndonConfigApi.getAndonConfigList()
  if (type === 'create') {
    dialogTitle.value = '新增安灯呼叫'
    // 自动填充当前用户
    const userStore = useUserStoreWithOut()
    formData.value.userId = userStore.getUser?.id
    formData.value.userNickname = userStore.getUser?.nickname
  } else if (type === 'detail') {
    dialogTitle.value = '安灯呼叫详情'
    formLoading.value = true
    try {
      formData.value = await ProAndonRecordApi.getAndonRecord(id!)
      // 回显选中的配置
      const config = configList.value.find((c) => c.reason === formData.value.reason)
      if (config) {
        selectedConfigId.value = config.id
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 选择配置后自动填充原因和级别 */
const handleConfigChange = (configId: number) => {
  const config = configList.value.find((c) => c.id === configId)
  if (config) {
    formData.value.reason = config.reason
    formData.value.level = config.level
  } else {
    formData.value.reason = undefined
    formData.value.level = undefined
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await ProAndonRecordApi.createAndonRecord(formData.value)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    workstationId: undefined,
    userId: undefined,
    userNickname: undefined,
    workOrderId: undefined,
    processId: undefined,
    reason: undefined,
    level: undefined,
    remark: undefined
  }
  selectedConfigId.value = undefined
  formRef.value?.resetFields()
}
</script>
