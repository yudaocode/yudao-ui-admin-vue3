<!-- 安灯呼叫记录 新增/处置/详情弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formType === 'create' ? createRules : undefined"
      label-width="100px"
      v-loading="formLoading"
    >
      <!-- ====== 呼叫信息（create 可编辑，update/detail 只读） ====== -->
      <el-form-item label="工作站" prop="workstationId">
        <MdWorkstationSelect
          v-if="formType === 'create'"
          v-model="formData.workstationId"
          placeholder="请选择工作站"
        />
        <el-input v-else :model-value="formData.workstationName" disabled />
      </el-form-item>
      <el-form-item label="发起人" prop="userId">
        <UserSelectV2 v-if="formType === 'create'" v-model="formData.userId" />
        <el-input v-else :model-value="formData.userNickname" disabled />
      </el-form-item>
      <el-form-item label="生产工单" prop="workOrderId">
        <ProWorkOrderSelect
          v-if="formType === 'create'"
          v-model="formData.workOrderId"
          :status="MesProWorkOrderStatusEnum.CONFIRMED"
          placeholder="请选择工单（可选）"
        />
        <el-input v-else :model-value="formData.workOrderCode || '-'" disabled />
      </el-form-item>
      <el-form-item label="工序" prop="processId">
        <ProProcessSelect
          v-if="formType === 'create'"
          v-model="formData.processId"
          placeholder="请选择工序（可选）"
        />
        <el-input v-else :model-value="formData.processName || '-'" disabled />
      </el-form-item>
      <el-form-item label="呼叫原因" prop="configId">
        <AndonConfigSelect
          v-if="formType === 'create'"
          v-model="formData.configId"
          @change="handleConfigChange"
        />
        <el-input v-else :model-value="formData.reason" disabled />
      </el-form-item>
      <el-form-item label="级别">
        <template v-if="formType === 'create'">
          <dict-tag
            v-if="formData.level"
            :type="DICT_TYPE.MES_PRO_ANDON_LEVEL"
            :value="formData.level"
          />
          <span v-else class="text-gray-400">由呼叫原因自动带出</span>
        </template>
        <dict-tag v-else :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
      </el-form-item>

      <!-- ====== 处置信息（update 可编辑，detail 只读，create 不展示） ====== -->
      <template v-if="formType !== 'create'">
        <el-divider content-position="left">处置信息</el-divider>
        <el-form-item label="状态">
          <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="formData.status" />
        </el-form-item>
        <el-form-item label="处置时间">
          <el-date-picker
            v-if="formType === 'update'"
            v-model="formData.handleTime"
            type="datetime"
            value-format="x"
            placeholder="请选择处置时间"
            class="!w-full"
          />
          <el-input v-else :model-value="formData.handleTime || '-'" disabled />
        </el-form-item>
        <el-form-item label="处置人">
          <UserSelectV2 v-if="formType === 'update'" v-model="formData.handlerUserId" />
          <el-input v-else :model-value="formData.handlerUserNickname || '-'" disabled />
        </el-form-item>
      </template>

      <!-- ====== 备注（create/update 可编辑，detail 只读） ====== -->
      <el-form-item label="备注">
        <el-input
          v-if="formType !== 'detail'"
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
        />
        <span v-else>{{ formData.remark || '-' }}</span>
      </el-form-item>
    </el-form>

    <!-- ====== 底部按钮 ====== -->
    <template #footer>
      <!-- create 模式 -->
      <template v-if="formType === 'create'">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleCreate" :disabled="formLoading">确 定</el-button>
      </template>
      <!-- update 模式 -->
      <template v-else-if="formType === 'update'">
        <el-button @click="dialogVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handleSave" :disabled="formLoading">保 存</el-button>
        <el-button type="success" @click="handleFinish" :disabled="formLoading">已处置</el-button>
      </template>
      <!-- detail 模式 -->
      <template v-else>
        <el-button @click="dialogVisible = false">关 闭</el-button>
      </template>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProAndonRecordApi } from '@/api/mes/pro/andon/record'
import { ProAndonConfigVO } from '@/api/mes/pro/andon/config'
import { DICT_TYPE } from '@/utils/dict'
import { useUserStoreWithOut } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import { MesProAndonStatusEnum, MesProWorkOrderStatusEnum } from '@/views/mes/utils/constants'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProProcessSelect from '@/views/mes/pro/process/components/ProProcessSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import AndonConfigSelect from '../config/components/AndonConfigSelect.vue'

defineOptions({ name: 'AndonRecordForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 处置；detail - 详情
const dialogTitle = computed(() =>
  formType.value === 'create'
    ? '新增安灯呼叫'
    : formType.value === 'update'
      ? '处置安灯呼叫'
      : '安灯呼叫详情'
) // 弹窗的标题
const formData = ref<any>({}) // 表单数据
const formRef = ref() // 表单 Ref
const createRules = reactive({
  workstationId: [{ required: true, message: '工作站不能为空', trigger: 'change' }],
  configId: [{ required: true, message: '呼叫原因不能为空', trigger: 'change' }]
})
const userStore = useUserStoreWithOut()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  if (type === 'create') {
    // 新增时，自动填充当前用户
    formData.value.userId = userStore.getUser?.id
  } else {
    // 修改 / 详情时，设置数据
    formLoading.value = true
    try {
      formData.value = await ProAndonRecordApi.getAndonRecord(id!)
      // 处置模式下，默认填充处置时间和处置人
      if (type === 'update') {
        if (!formData.value.handleTime) {
          formData.value.handleTime = formatDate(new Date())
        }
        if (!formData.value.handlerUserId) {
          formData.value.handlerUserId = userStore.getUser?.id
        }
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

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

/** 提交新增 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const handleCreate = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    await ProAndonRecordApi.createAndonRecord(formData.value)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 保存处置信息（保持 ACTIVE 状态） */
const handleSave = async () => {
  // 提交请求
  formLoading.value = true
  try {
    await ProAndonRecordApi.updateAndonRecord({
      id: formData.value.id,
      handleTime: formData.value.handleTime,
      handlerUserId: formData.value.handlerUserId,
      remark: formData.value.remark,
      status: MesProAndonStatusEnum.ACTIVE
    })
    message.success('保存成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 标记已处置（状态变更为 HANDLED） */
const handleFinish = async () => {
  // 校验处置人和处置时间
  if (!formData.value.handleTime) {
    message.warning('标记已处置时，处置时间不能为空')
    return
  }
  if (!formData.value.handlerUserId) {
    message.warning('标记已处置时，处置人不能为空')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    await ProAndonRecordApi.updateAndonRecord({
      id: formData.value.id,
      handleTime: formData.value.handleTime,
      handlerUserId: formData.value.handlerUserId,
      remark: formData.value.remark,
      status: MesProAndonStatusEnum.HANDLED
    })
    message.success('处置成功')
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
