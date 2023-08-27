<template>
  <Dialog title="回复" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="回复内容" prop="replyContent">
        <el-input type="textarea" v-model="formData.replyContent" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitReplyForm" type="primary" :disabled="formLoading">确 定 </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as CommentApi from '@/api/mall/product/comment'
import { ElInput } from 'element-plus'

defineOptions({ name: 'ProductComment' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  replyContent: undefined
})
const formRules = reactive({
  replyContent: [{ required: true, message: '回复内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (id?: number) => {
  resetForm()
  formData.value.id = id
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitReplyForm = async () => {
  // 校验表单
  const valid = await formRef?.value?.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await CommentApi.replyComment(formData.value)
    message.success(t('common.createSuccess'))
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
    id: undefined,
    replyContent: undefined
  }
  formRef.value?.resetFields()
}
</script>
