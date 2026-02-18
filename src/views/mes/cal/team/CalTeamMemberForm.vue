<template>
  <Dialog title="添加成员" v-model="dialogVisible" width="500px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="用户" prop="userId">
        <el-select
          v-model="formData.userId"
          placeholder="请选择用户"
          filterable
          class="!w-1/1"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'
import { getSimpleUserList } from '@/api/system/user'
import type { UserVO } from '@/api/system/user'

defineOptions({ name: 'CalTeamMemberForm' })

const emit = defineEmits<{ success: [] }>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const userList = ref<UserVO[]>([])

const formData = ref({
  teamId: undefined as number | undefined,
  userId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户不能为空', trigger: 'change' }]
})

/** 打开弹窗 */
const open = async (teamId: number) => {
  dialogVisible.value = true
  formData.value = { teamId, userId: undefined, remark: undefined }
  formRef.value?.resetFields()
  userList.value = await getSimpleUserList()
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    await CalTeamMemberApi.createTeamMember(formData.value as unknown as CalTeamMemberVO)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
