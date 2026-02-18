<!-- MES 操作步骤表单弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="序号" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="1"
          :max="999"
          controls-position="right"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="步骤说明" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="3"
          placeholder="请输入步骤说明"
        />
      </el-form-item>
      <el-form-item label="辅助设备" prop="device">
        <el-input v-model="formData.device" placeholder="请输入辅助设备" />
      </el-form-item>
      <el-form-item label="辅助材料" prop="material">
        <el-input v-model="formData.material" placeholder="请输入辅助材料" />
      </el-form-item>
      <el-form-item label="材料文档 URL" prop="docUrl">
        <el-input v-model="formData.docUrl" placeholder="请输入材料文档 URL" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ProProcessContentApi, ProProcessContentVO } from '@/api/mes/pro/process/content'

defineOptions({ name: 'ProProcessContentForm' })

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<Partial<ProProcessContentVO>>({
  id: undefined,
  processId: undefined,
  sort: 1,
  content: '',
  device: '',
  material: '',
  docUrl: '',
  remark: ''
})
const formRules = reactive({
  sort: [{ required: true, message: '序号不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = (type: string, processId: number, maxSort: number, row?: ProProcessContentVO) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加操作步骤' : '编辑操作步骤'
  formType.value = type
  resetForm(processId, maxSort)
  // 修改时，设置数据
  if (row) {
    formData.value = { ...row }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ProProcessContentVO
    if (formType.value === 'create') {
      await ProProcessContentApi.createProcessContent(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProProcessContentApi.updateProcessContent(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = (processId: number, maxSort: number) => {
  formData.value = {
    id: undefined,
    processId,
    sort: maxSort + 1,
    content: '',
    device: '',
    material: '',
    docUrl: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
