<template>
  <div>
    <el-dialog
      v-model:visible="dialogVisible"
      :title="title"
      @closed="close"
      append-to-body
      destroy-on-close
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label-width="180px" label="渠道状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
              :key="parseInt(dict.value)"
              :label="parseInt(dict.value)"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label-width="180px" label="备注" prop="remark">
          <el-input v-model="formData.remark" :style="{ width: '100%' }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup name="MockChannelForm">
import { createChannel, getChannel, updateChannel } from '@/api/pay/channel'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const formLoading = ref(false)
const title = ref('')
const formData = ref<any>({
  appId: '',
  code: '',
  status: undefined,
  feeRate: 0,
  remark: '',
  config: {
    name: 'mock-conf'
  }
})

const rules = {
  status: [{ required: true, message: '渠道状态不能为空', trigger: 'blur' }]
}

const formRef = ref()

const emit = defineEmits(['success'])

const open = async (appId, code) => {
  dialogVisible.value = true
  formLoading.value = true
  reset(appId, code)

  try {
    const data = await getChannel(appId, code)

    if (data && data.id) {
      formData.value = data
      formData.value.config = JSON.parse(data.config)
    }
    title.value = !formData.value.id ? '创建支付渠道' : '编辑支付渠道'
  } finally {
    formLoading.value = false
  }
}

const close = () => {
  dialogVisible.value = false
  reset(undefined, undefined)
}

const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  const data = { ...formData.value }
  data.config = JSON.stringify(formData.value.config)
  if (!data.id) {
    createChannel(data).then(() => {
      message.success('新增成功')
      emit('success')
      close()
    })
  } else {
    updateChannel(data).then(() => {
      message.success('修改成功')
      emit('success')
      close()
    })
  }
}

/** 重置表单 */
const reset = (appId, code) => {
  formData.value = {
    appId: appId,
    code: code,
    status: CommonStatusEnum.ENABLE,
    remark: '',
    feeRate: 0,
    config: {
      name: 'mock-conf'
    }
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
