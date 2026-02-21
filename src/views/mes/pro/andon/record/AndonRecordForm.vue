<!-- 安灯呼叫记录 新增/详情弹窗 -->
<!-- TODO @芋艿：需要提供这样的新增么？ -->
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
        <UserSelect v-model="formData.userId" />
      </el-form-item>
      <!-- TODO @芋艿：这里的 select 组件 -->
      <el-form-item label="生产工单" prop="workOrderId">
        <el-input
          v-model="formData.workOrderId"
          placeholder="请输入工单编号（可选）"
          type="number"
        />
      </el-form-item>
      <!-- TODO @芋艿：这里的 select 组件 -->
      <el-form-item label="工序" prop="processId">
        <el-input v-model="formData.processId" placeholder="请输入工序编号（可选）" type="number" />
      </el-form-item>
      <el-form-item label="呼叫原因" prop="configId">
        <AndonConfigSelect v-model="formData.configId" @change="handleConfigChange" />
      </el-form-item>
      <el-form-item label="级别" prop="level">
        <dict-tag
          v-if="formData.level"
          :type="DICT_TYPE.MES_PRO_ANDON_LEVEL"
          :value="formData.level"
        />
        <span v-else class="text-gray-400">由呼叫原因自动带出</span>
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
import { ProAndonRecordApi } from '@/api/mes/pro/andon/record'
import { ProAndonConfigVO } from '@/api/mes/pro/andon/config'
import { DICT_TYPE } from '@/utils/dict'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import AndonConfigSelect from '../config/components/AndonConfigSelect.vue'
import { useUserStoreWithOut } from '@/store/modules/user'

/** 安灯呼叫记录 新增/详情弹窗 */
defineOptions({ name: 'AndonRecordForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；detail - 详情
const formData = ref<any>({}) // 表单数据
const formRules = reactive({
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  configId: [{ required: true, message: '呼叫原因不能为空', trigger: 'change' }],
  level: [{ required: true, message: '级别不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增安灯呼叫' : '安灯呼叫详情'
  formType.value = type
  resetForm()
  if (type === 'create') {
    // 自动填充当前用户
    const userStore = useUserStoreWithOut()
    formData.value.userId = userStore.getUser?.id
  } else if (type === 'detail') {
    formLoading.value = true
    try {
      formData.value = await ProAndonRecordApi.getAndonRecord(id!)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 选择配置后自动填充原因和级别 */
const handleConfigChange = (config: ProAndonConfigVO | undefined) => {
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
    workOrderId: undefined,
    processId: undefined,
    configId: undefined,
    reason: undefined,
    level: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
