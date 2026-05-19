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
        <el-select
          v-model="formData.channelId"
          placeholder="请选择频道（用于加载素材）"
          class="!w-full"
          @change="onChannelChange"
        >
          <el-option v-for="c in props.channelList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="素材" prop="materialId">
        <el-select
          v-model="formData.materialId"
          placeholder="请选择素材"
          class="!w-full"
          :disabled="!formData.channelId"
        >
          <el-option
            v-for="m in materialList"
            :key="m.id"
            :label="m.title"
            :value="m.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="受众">
        <el-radio-group v-model="targetType">
          <el-radio value="all">全员</el-radio>
          <el-radio value="users">指定用户</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- TODO @AI：userselect 组件 -->
      <el-form-item v-if="targetType === 'users'" label="接收用户" prop="receiverUserIds">
        <el-input
          v-model="receiverInput"
          placeholder="多个用户编号用英文逗号分隔，如 1,1024,2048"
          type="textarea"
          :rows="2"
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
// TODO @AI：注释风格，对齐 user form；
import * as MessageApi from '@/api/im/manager/channel/message'
import * as MaterialApi from '@/api/im/manager/channel/material'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'

defineOptions({ name: 'ImChannelMessageSendForm' })

const props = defineProps<{ channelList: ImManagerChannelVO[] }>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined
})
const targetType = ref<'all' | 'users'>('all')
const receiverInput = ref('')
const materialList = ref<MaterialApi.ImManagerChannelMaterialVO[]>([])

const formRules = reactive({
  channelId: [{ required: true, message: '请选择频道', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择素材', trigger: 'change' }]
})
const formRef = ref()

const open = () => {
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open })

const emit = defineEmits(['success'])

/** 切换频道时加载该频道下的素材列表 */
const onChannelChange = async (channelId: number | undefined) => {
  formData.value.materialId = undefined
  materialList.value = []
  if (!channelId) return
  const page = await MaterialApi.getManagerChannelMaterialPage({
    pageNo: 1,
    pageSize: 100,
    channelId
  } as any)
  materialList.value = page.list
}

const submitForm = async () => {
  await formRef.value.validate()
  let receiverUserIds: number[] | undefined
  if (targetType.value === 'users') {
    receiverUserIds = receiverInput.value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n))
    if (!receiverUserIds || receiverUserIds.length === 0) {
      message.error('请输入至少一个接收用户编号')
      return
    }
  }
  formLoading.value = true
  try {
    await MessageApi.sendManagerChannelMessage({
      materialId: formData.value.materialId!,
      receiverUserIds
    })
    message.success('推送成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = { channelId: undefined, materialId: undefined }
  targetType.value = 'all'
  receiverInput.value = ''
  materialList.value = []
  formRef.value?.resetFields()
}
</script>
