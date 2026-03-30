<!-- MES 排班管理-班组成员 列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button type="primary" plain size="small" @click="openForm()" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加成员
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="用户编号" align="center" prop="userId" width="100" />
      <el-table-column label="用户昵称" align="center" prop="nickname" min-width="120" />
      <el-table-column label="手机号" align="center" prop="telephone" min-width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加 -->
    <Dialog title="添加成员" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <el-form-item label="用户" prop="userId">
          <el-select v-model="formData.userId" placeholder="请选择用户" filterable class="!w-1/1">
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
  </div>
</template>

<script setup lang="ts">
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'
import { getSimpleUserList } from '@/api/system/user'
import type { UserVO } from '@/api/system/user'

defineOptions({ name: 'CalTeamMemberList' })

const props = defineProps<{
  teamId: number // 班组编号
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<CalTeamMemberVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await CalTeamMemberApi.getTeamMemberListByTeam(props.teamId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const userList = ref<UserVO[]>([]) // 用户下拉列表
const formData = ref({
  teamId: undefined as number | undefined,
  userId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户不能为空', trigger: 'change' }]
})

/** 打开表单弹窗 */
const openForm = async () => {
  dialogVisible.value = true
  formData.value = { teamId: props.teamId, userId: undefined, remark: undefined }
  formRef.value?.resetFields()
  userList.value = await getSimpleUserList()
}

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
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CalTeamMemberApi.deleteTeamMember(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 teamId 变化，加载列表 */
watch(
  () => props.teamId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>
