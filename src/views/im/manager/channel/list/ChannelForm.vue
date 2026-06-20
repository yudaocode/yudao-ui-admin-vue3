<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="520">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="频道编码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="如 system_notice"
          :disabled="formType === 'update'"
        />
      </el-form-item>
      <el-form-item label="频道名称" prop="name">
        <el-input v-model="formData.name" placeholder="如 系统公告" />
      </el-form-item>
      <el-form-item label="频道头像" prop="avatar">
        <UploadImg v-model="formData.avatar" :limit="1" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ChannelApi from '@/api/im/manager/channel'
import { CommonStatusEnum } from '@/utils/constants'

defineOptions({ name: 'ImChannelForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined as number | undefined,
  code: '',
  name: '',
  avatar: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  code: [
    { required: true, message: '频道编码不能为空', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '只能由小写字母 / 数字 / 下划线组成，且以字母开头',
      trigger: 'blur'
    }
  ],
  name: [{ required: true, message: '频道名称不能为空', trigger: 'blur' }],
  avatar: [{ required: true, message: '频道头像不能为空', trigger: 'change' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ChannelApi.getManagerChannel(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])

/** 提交 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as ChannelApi.ImManagerChannelVO
    if (formType.value === 'create') {
      await ChannelApi.createManagerChannel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ChannelApi.updateManagerChannel(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    code: '',
    name: '',
    avatar: '',
    sort: 0,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
