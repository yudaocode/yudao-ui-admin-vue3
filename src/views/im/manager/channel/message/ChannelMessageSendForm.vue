<template>
  <Dialog title="立即推送频道消息" v-model="dialogVisible" width="640">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="所属频道" prop="channelId">
        <ChannelSelect v-model="formData.channelId" placeholder="请选择频道（用于加载素材）" />
      </el-form-item>
      <el-form-item label="素材" prop="materialId">
        <MaterialSelect
          v-model="formData.materialId"
          :channel-id="formData.channelId"
          placeholder="请选择素材"
        />
      </el-form-item>
      <el-form-item label="受众">
        <el-radio-group v-model="formData.receiverUserType">
          <el-radio value="all">全员</el-radio>
          <el-radio value="users">指定用户</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.receiverUserType === 'users'"
        label="接收用户"
        prop="receiverUserIds"
      >
        <UserSelectV2
          v-model="formData.receiverUserIds"
          :multiple="true"
          placeholder="请选择接收用户"
          @change="handleReceiverUserChange"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确认推送</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as MessageApi from '@/api/im/manager/channel/message'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import ChannelSelect from '../list/components/ChannelSelect.vue'
import MaterialSelect from '../material/components/MaterialSelect.vue'

defineOptions({ name: 'ImChannelMessageSendForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined,
  receiverUserType: 'all' as 'all' | 'users', // 接收用户类型：全员 / 指定用户
  receiverUserIds: [] as number[]
})

const formRules = reactive({
  channelId: [{ required: true, message: '请选择频道', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择素材', trigger: 'change' }],
  receiverUserIds: [{ required: true, message: '请至少选择一个接收用户', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 接收用户变化 */
const handleReceiverUserChange = () => {
  formRef.value?.validateField('receiverUserIds')
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await MessageApi.sendManagerChannelMessage({
      materialId: formData.value.materialId!,
      receiverUserIds:
        formData.value.receiverUserType === 'users' ? formData.value.receiverUserIds : undefined
    })
    message.success('推送成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    channelId: undefined,
    materialId: undefined,
    receiverUserType: 'all',
    receiverUserIds: []
  }
  formRef.value?.resetFields()
}
</script>
