<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="720">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="所属频道" prop="channelId">
        <!-- TODO @AI：使用 channelselect 组件 -->
        <el-select v-model="formData.channelId" placeholder="请选择频道" class="!w-full">
          <el-option v-for="c in props.channelList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="图文标题" maxlength="128" show-word-limit />
      </el-form-item>
      <el-form-item label="封面图" prop="coverUrl">
        <el-input v-model="formData.coverUrl" placeholder="封面图 URL" />
      </el-form-item>
      <el-form-item label="摘要" prop="summary">
        <el-input
          v-model="formData.summary"
          placeholder="一句话摘要"
          type="textarea"
          :rows="2"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <!-- TODO @AI：需要增加 type； -->
      <el-form-item label="跳转链接" prop="url">
        <el-input
          v-model="formData.url"
          placeholder="为空走站内详情页渲染 content；非空则跳此链接"
        />
      </el-form-item>
      <el-form-item label="正文" prop="content">
        <el-input
          v-model="formData.content"
          placeholder="富文本 HTML"
          type="textarea"
          :rows="8"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
// TODO @AI：补充一些注释，对齐 system user form；
import * as MaterialApi from '@/api/im/manager/channel/material'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'

defineOptions({ name: 'ImChannelMaterialForm' })

const props = defineProps<{ channelList: ImManagerChannelVO[] }>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined as number | undefined,
  channelId: undefined as number | undefined,
  // TODO @AI：不是这种 type；是 1 为外链；2 为图文；
  type: 125, // MATERIAL
  title: '',
  coverUrl: '',
  summary: '',
  content: '',
  url: ''
})
const formRules = reactive({
  channelId: [{ required: true, message: '所属频道不能为空', trigger: 'change' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MaterialApi.getManagerChannelMaterial(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as MaterialApi.ImManagerChannelMaterialVO
    if (formType.value === 'create') {
      await MaterialApi.createManagerChannelMaterial(data)
      message.success(t('common.createSuccess'))
    } else {
      await MaterialApi.updateManagerChannelMaterial(data)
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
    channelId: undefined,
    type: 125,
    title: '',
    coverUrl: '',
    summary: '',
    content: '',
    url: ''
  }
  formRef.value?.resetFields()
}
</script>
