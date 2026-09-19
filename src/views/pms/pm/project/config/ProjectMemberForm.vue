<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="88px"
    >
      <el-form-item v-if="formType === 'create'" label="项目成员" prop="userIds">
        <UserSelectV2
          v-model="formData.userIds"
          :disabled-ids="existingUserIds"
          :multiple="true"
          placeholder="请选择需要加入项目的用户"
        />
      </el-form-item>
      <el-form-item v-else label="项目成员">
        <div class="flex items-center gap-8px">
          <el-avatar :size="30" :src="currentMember?.avatar">
            {{ currentMember?.nickname?.slice(0, 1) }}
          </el-avatar>
          <span>{{ currentMember?.nickname || `用户 #${currentMember?.userId}` }}</span>
        </div>
      </el-form-item>
      <el-form-item label="权限级别" prop="level">
        <el-select v-model="formData.level" class="!w-100%" placeholder="请选择权限级别">
          <el-option
            v-for="option in assignableLevelOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { PmsProjectMemberLevel } from '@/views/pms/pm/utils/constants'

defineOptions({ name: 'PmsProjectMemberForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const formType = ref<'create' | 'update'>('create') // 表单类型
const projectId = ref<number>() // 当前项目编号
const currentMember = ref<ProjectMemberApi.PmsProjectMemberVO>() // 当前编辑成员
const existingUserIds = ref<number[]>([]) // 已加入项目的用户编号
const formData = ref({
  userIds: [] as number[],
  level: PmsProjectMemberLevel.WRITE as number
})
const formRules = reactive<FormRules>({
  userIds: [{ required: true, message: '请选择项目成员', trigger: 'change' }],
  level: [{ required: true, message: '请选择权限级别', trigger: 'change' }]
})
const formRef = ref<FormInstance>() // 表单 Ref
const assignableLevelOptions = getIntDictOptions(DICT_TYPE.PMS_PROJECT_MEMBER_LEVEL).filter(
  (option) => option.value !== PmsProjectMemberLevel.OWNER
) // 可以分配的成员权限级别

/** 打开弹窗 */
function open(
  type: 'create' | 'update',
  id: number,
  projectName: string,
  memberList: ProjectMemberApi.PmsProjectMemberVO[],
  member?: ProjectMemberApi.PmsProjectMemberVO
) {
  dialogVisible.value = true
  dialogTitle.value = `${projectName} - ${type === 'create' ? '新增成员' : '修改成员'}`
  resetForm()
  formType.value = type
  projectId.value = id
  currentMember.value = member
  existingUserIds.value = memberList.map((item) => item.userId)
  formData.value.userIds = member ? [member.userId] : []
  formData.value.level = member?.level || PmsProjectMemberLevel.WRITE
}
defineExpose({ open }) // 提供 open 方法

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value || !projectId.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await ProjectMemberApi.updateProjectMemberList(
      projectId.value,
      formData.value.userIds.map((userId) => ({ userId, level: formData.value.level }))
    )
    message.success(formType.value === 'create' ? '成员添加成功' : '成员修改成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  projectId.value = undefined
  currentMember.value = undefined
  existingUserIds.value = []
  formData.value = {
    userIds: [],
    level: PmsProjectMemberLevel.WRITE
  }
  formRef.value?.resetFields()
}
</script>
