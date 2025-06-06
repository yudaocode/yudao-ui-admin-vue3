<template>
  <Dialog title="修改用户等级" v-model="dialogVisible" width="600">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="用户编号" prop="id">
        <el-input v-model="formData.id" placeholder="请输入用户昵称" class="!w-240px" disabled />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input
          v-model="formData.nickname"
          placeholder="请输入用户昵称"
          class="!w-240px"
          disabled
        />
      </el-form-item>
      <el-form-item label="用户等级" prop="levelId">
        <MemberLevelSelect v-model="formData.levelId" />
      </el-form-item>
      <el-form-item label="修改原因" prop="reason">
        <el-input type="textarea" v-model="formData.reason" placeholder="请输入修改原因" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as UserApi from '@/api/member/user'
import MemberLevelSelect from '@/views/member/level/components/MemberLevelSelect.vue'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  nickname: undefined,
  levelId: undefined,
  reason: undefined
})
const formRules = reactive({
  reason: [{ required: true, message: '修改原因不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (id?: number) => {
  dialogVisible.value = true
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await UserApi.getUser(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await UserApi.updateUserLevel(formData.value)

    message.success(t('common.updateSuccess'))
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
    nickname: undefined,
    levelId: undefined,
    reason: undefined
  }
  formRef.value?.resetFields()
}
</script>
