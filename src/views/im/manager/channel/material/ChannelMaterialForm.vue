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
        <ChannelSelect v-model="formData.channelId" placeholder="请选择频道" />
      </el-form-item>
      <el-form-item label="内容类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="图文标题" maxlength="128" show-word-limit />
      </el-form-item>
      <el-form-item label="封面图" prop="coverUrl">
        <UploadImg v-model="formData.coverUrl" :limit="1" />
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
      <!-- 内容类型为「站内富文本」时展示 content 富文本编辑器；「外链」时展示 url 输入 -->
      <el-form-item v-if="formData.type === 1" label="正文" prop="content">
        <Editor v-model="formData.content" height="320px" />
      </el-form-item>
      <el-form-item v-else label="跳转链接" prop="url">
        <el-input v-model="formData.url" placeholder="https://example.com/..." />
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
import * as MaterialApi from '@/api/im/manager/channel/material'
import ChannelSelect from '../list/components/ChannelSelect.vue'

defineOptions({ name: 'ImChannelMaterialForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  channelId: undefined as number | undefined,
  type: 1, // 内容类型；1 站内富文本 2 外链；参见 ImChannelMaterialTypeEnum
  title: '',
  coverUrl: '',
  summary: '',
  content: '',
  url: ''
})
const formRules = reactive({
  channelId: [{ required: true, message: '所属频道不能为空', trigger: 'change' }],
  type: [{ required: true, message: '内容类型不能为空', trigger: 'change' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时回填数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MaterialApi.getManagerChannelMaterial(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
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

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    channelId: undefined,
    type: 1,
    title: '',
    coverUrl: '',
    summary: '',
    content: '',
    url: ''
  }
  formRef.value?.resetFields()
}
</script>
